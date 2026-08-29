import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject, makeTopic } from "../test/fixtures";
import {
  API,
  bodyOf,
  emptyResponse,
  headersOf,
  initOf,
  installFetch,
  jsonResponse,
  textResponse,
  urlOf,
  type FetchMock,
} from "../test/http";
import type { Subject } from "../types/api";

let fetchMock: FetchMock;

type Services = Awaited<ReturnType<typeof load>>;

const load = async () => {
  vi.resetModules();

  const session = await import("./session");
  const subjects = await import("./subjectsService");

  return { ...session, ...subjects };
};

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_API_BASE_URL", API);
  fetchMock = installFetch();

  // The services log the server response before they throw. Useful in the browser,
  // noise here.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const page = (data: Subject[]) =>
  jsonResponse({ subjects: { pageIndex: 0, pageSize: 1000, count: data.length, data } });

describe("fetchSubjects", () => {
  /**
   * The catalogue is fetched in one request - the page shows every subject grouped, and
   * paging would only have split that grouping up.
   */
  it("fetches the whole catalogue in one call", async () => {
    fetchMock.mockResolvedValue(page([makeSubject()]));

    const { fetchSubjects } = await load();
    const result = await fetchSubjects();

    expect(result).toHaveLength(1);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects?pageIndex=0&pageSize=1000`);
    expect(initOf(fetchMock).method).toBe("GET");
  });

  it("unwraps the subjects from the page envelope", async () => {
    fetchMock.mockResolvedValue(page([makeSubject({ code: "PSI-101" })]));

    const { fetchSubjects } = await load();

    expect((await fetchSubjects())[0].code).toBe("PSI-101");
  });

  it("gives an empty list when the page carries no data", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ subjects: { pageIndex: 0, pageSize: 1000, count: 0, data: null } })
    );

    const { fetchSubjects } = await load();

    expect(await fetchSubjects()).toEqual([]);
  });

  it("throws with the status when the catalogue cannot be fetched", async () => {
    fetchMock.mockResolvedValue(emptyResponse(500));

    const { fetchSubjects } = await load();

    await expect(fetchSubjects()).rejects.toThrow("Failed to fetch subjects: 500");
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchSubjects, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchSubjects()).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  /**
   * The catalogue is open, but a lecturer gets their own hidden topics with it - so the
   * token goes along whenever there is one.
   */
  it("sends the token when someone is signed in", async () => {
    fetchMock.mockResolvedValue(page([]));

    const { fetchSubjects, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchSubjects();

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });
});

describe("updateSubjectTopics", () => {
  const subject = makeSubject({ id: "s-1", version: 7 });

  it("puts the new topics on the subject and sends the whole graph", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    const topics = [makeTopic({ id: "t-1", title: "New topic" })];

    await updateSubjectTopics(subject, topics);

    const sent = bodyOf<Subject>(fetchMock);

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1`);
    expect(initOf(fetchMock).method).toBe("PUT");
    expect(sent.topics).toHaveLength(1);
    expect(sent.topics[0].title).toBe("New topic");
    expect(sent.code).toBe(subject.code);
  });

  /**
   * The version has to be there, or the server skips the conflict check and a concurrent
   * save is overwritten in silence.
   */
  it("sends the version the subject was read with", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(subject, []);

    expect(bodyOf<Subject>(fetchMock).version).toBe(7);
  });

  it("sends the lecturer and assistant back unchanged", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(subject, []);

    const sent = bodyOf<Subject>(fetchMock);

    expect(sent.lecturer).toBe(subject.lecturer);
    expect(sent.assistant).toBe(subject.assistant);
  });

  it("leaves the subject it was handed alone", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(subject, [makeTopic()]);

    expect(subject.topics).toEqual([]);
  });

  /**
   * 409 gets its own error type, so the page can tell "someone else saved first" from
   * everything else with instanceof rather than reaching for a field that only sometimes
   * exists.
   */
  it("gives a conflict error when someone else saved first", async () => {
    fetchMock.mockResolvedValue(textResponse("conflict", 409));

    const { ConflictError, updateSubjectTopics } = await load();

    await expect(updateSubjectTopics(subject, [])).rejects.toBeInstanceOf(ConflictError);
  });

  it("gives an ordinary error for anything but a conflict", async () => {
    fetchMock.mockResolvedValue(textResponse("no", 400));

    const { ConflictError, updateSubjectTopics } = await load();

    const error = await updateSubjectTopics(subject, []).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ConflictError);
    expect((error as Error).message).toBe("Failed to update subject s-1");
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateSubjectTopics } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectTopics(subject, [])).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  /**
   * 403 is "you may only edit subjects you teach" - a valid session meeting an ownership
   * rule, not a dead token.
   */
  it("keeps the session when the server answers 403", async () => {
    fetchMock.mockResolvedValue(emptyResponse(403));

    const { getSession, storeSession, updateSubjectTopics } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectTopics(subject, [])).rejects.toThrow();

    expect(getSession().token).toBe("abc123");
  });
});

describe("updateTopicOrder", () => {
  it("sends the order only, not the whole subject", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicOrder } = await load();
    await updateTopicOrder("s-1", ["t-2", "t-1"]);

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1/topics/order`);
    expect(initOf(fetchMock).method).toBe("PUT");
    expect(bodyOf(fetchMock)).toEqual({ topicIds: ["t-2", "t-1"] });
  });

  it("keeps the order it was handed", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicOrder } = await load();
    await updateTopicOrder("s-1", ["c", "a", "b"]);

    expect(bodyOf<{ topicIds: string[] }>(fetchMock).topicIds).toEqual(["c", "a", "b"]);
  });

  it("throws when the order is refused", async () => {
    fetchMock.mockResolvedValue(textResponse("no", 400));

    const { updateTopicOrder } = await load();

    await expect(updateTopicOrder("s-1", [])).rejects.toThrow(
      "Failed to reorder topics on subject s-1"
    );
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateTopicOrder } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateTopicOrder("s-1", [])).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("updateTopicState", () => {
  it("sends the flag as a patch against the one topic", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isHidden: true });

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1/topics/t-1`);
    expect(initOf(fetchMock).method).toBe("PATCH");
    expect(bodyOf(fetchMock)).toEqual({ isHidden: true });
  });

  /**
   * An omitted flag lets the server leave that field as it is. Were the service to send
   * both every time, hiding a topic would rewrite its deletion state as well.
   */
  it("sends only the flags it was handed", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isDeleted: true });

    expect(bodyOf(fetchMock)).toEqual({ isDeleted: true });
  });

  it("can send both flags at once", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isHidden: true, isDeleted: false });

    expect(bodyOf(fetchMock)).toEqual({ isHidden: true, isDeleted: false });
  });

  it("throws with the topic id when the change is refused", async () => {
    fetchMock.mockResolvedValue(textResponse("no", 404));

    const { updateTopicState } = await load();

    await expect(updateTopicState("s-1", "t-1", { isHidden: true })).rejects.toThrow(
      "Failed to update topic t-1"
    );
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateTopicState } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateTopicState("s-1", "t-1", { isHidden: true })).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("updateSubjectPeople", () => {
  it("sends the staff to their own endpoint", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectPeople } = await load();
    await updateSubjectPeople("s-1", "pnikolic", "mmarkovic");

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1/staff`);
    expect(initOf(fetchMock).method).toBe("PUT");
    expect(bodyOf(fetchMock)).toEqual({
      lecturer: "pnikolic",
      assistant: "mmarkovic",
    });
  });

  /**
   * One representation of "no assistant". The general subject update cannot express it at
   * all, because null there means "leave this field alone".
   */
  it.each([
    ["null", null],
    ["an empty string", ""],
  ])("turns %s into no assistant at all", async (_name, assistant) => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectPeople } = await load();
    await updateSubjectPeople("s-1", "pnikolic", assistant);

    expect(bodyOf(fetchMock)).toEqual({ lecturer: "pnikolic", assistant: null });
  });

  it("throws with the subject id when the staff is refused", async () => {
    fetchMock.mockResolvedValue(textResponse("no such lecturer", 400));

    const { updateSubjectPeople } = await load();

    await expect(updateSubjectPeople("s-1", "nobody", null)).rejects.toThrow(
      "Failed to update staff on subject s-1"
    );
  });

  it("drops the session when the server refuses the token", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateSubjectPeople } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectPeople("s-1", "pnikolic", null)).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

/**
 * Every write goes through the same header builder. The content type and the token belong
 * together: a write without a token is a 401, and without the json header a 415.
 */
describe("the write calls", () => {
  const calls = {
    updateSubjectTopics: (s: Services) => s.updateSubjectTopics(makeSubject(), []),
    updateTopicOrder: (s: Services) => s.updateTopicOrder("s-1", []),
    updateTopicState: (s: Services) => s.updateTopicState("s-1", "t-1", { isHidden: true }),
    updateSubjectPeople: (s: Services) => s.updateSubjectPeople("s-1", "pnikolic", null),
  };

  it.each(Object.keys(calls) as (keyof typeof calls)[])(
    "%s sends json and the token",
    async (name) => {
      fetchMock.mockResolvedValue(emptyResponse(200));

      const services = await load();
      services.storeSession("abc123", { username: "pnikolic" });

      await calls[name](services);

      expect(headersOf(fetchMock)["Content-Type"]).toBe("application/json");
      expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
    }
  );
});
