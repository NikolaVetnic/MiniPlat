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

type Tjenester = Awaited<ReturnType<typeof load>>;

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

  // Tjenestene logger serversvaret før de kaster. Nyttig i nettleseren, støy her.
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
   * Katalogen hentes i én forespørsel - siden viser alle emner gruppert, og en
   * sidevisning ville bare ha delt opp den grupperingen.
   */
  it("henter hele katalogen i ett kall", async () => {
    fetchMock.mockResolvedValue(page([makeSubject()]));

    const { fetchSubjects } = await load();
    const result = await fetchSubjects();

    expect(result).toHaveLength(1);
    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects?pageIndex=0&pageSize=1000`);
    expect(initOf(fetchMock).method).toBe("GET");
  });

  it("pakker emnene ut av sideomslaget", async () => {
    fetchMock.mockResolvedValue(page([makeSubject({ code: "PSI-101" })]));

    const { fetchSubjects } = await load();

    expect((await fetchSubjects())[0].code).toBe("PSI-101");
  });

  it("gir tom liste når siden ikke har noen data", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ subjects: { pageIndex: 0, pageSize: 1000, count: 0, data: null } })
    );

    const { fetchSubjects } = await load();

    expect(await fetchSubjects()).toEqual([]);
  });

  it("kaster med statusen når katalogen ikke kan hentes", async () => {
    fetchMock.mockResolvedValue(emptyResponse(500));

    const { fetchSubjects } = await load();

    await expect(fetchSubjects()).rejects.toThrow("Failed to fetch subjects: 500");
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { fetchSubjects, getSession, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(fetchSubjects()).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  /**
   * Katalogen er åpen, men en foreleser får sine skjulte temaer med - så tokenet
   * følger med når det finnes.
   */
  it("sender tokenet når noen er logget inn", async () => {
    fetchMock.mockResolvedValue(page([]));

    const { fetchSubjects, storeSession } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await fetchSubjects();

    expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
  });
});

describe("updateSubjectTopics", () => {
  const emne = makeSubject({ id: "s-1", version: 7 });

  it("legger de nye temaene på emnet og sender hele grafen", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    const temaer = [makeTopic({ id: "t-1", title: "Nytt tema" })];

    await updateSubjectTopics(emne, temaer);

    const sendt = bodyOf<Subject>(fetchMock);

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1`);
    expect(initOf(fetchMock).method).toBe("PUT");
    expect(sendt.topics).toHaveLength(1);
    expect(sendt.topics[0].title).toBe("Nytt tema");
    expect(sendt.code).toBe(emne.code);
  });

  /**
   * Versjonen må være med, ellers hopper serveren over konfliktsjekken og en samtidig
   * lagring blir overskrevet i stillhet.
   */
  it("sender versjonen emnet ble lest med", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(emne, []);

    expect(bodyOf<Subject>(fetchMock).version).toBe(7);
  });

  it("sender foreleser og assistent tilbake uendret", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(emne, []);

    const sendt = bodyOf<Subject>(fetchMock);

    expect(sendt.lecturer).toBe(emne.lecturer);
    expect(sendt.assistant).toBe(emne.assistant);
  });

  it("rører ikke emnet den fikk", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectTopics } = await load();
    await updateSubjectTopics(emne, [makeTopic()]);

    expect(emne.topics).toEqual([]);
  });

  /**
   * 409 er sin egen feiltype, så siden kan skille «noen andre lagret først» fra alt
   * annet med instanceof i stedet for å lete etter et felt som bare finnes iblant.
   */
  it("gir en konfliktfeil når noen andre lagret først", async () => {
    fetchMock.mockResolvedValue(textResponse("konflikt", 409));

    const { ConflictError, updateSubjectTopics } = await load();

    await expect(updateSubjectTopics(emne, [])).rejects.toBeInstanceOf(ConflictError);
  });

  it("gir en vanlig feil for alt annet enn konflikt", async () => {
    fetchMock.mockResolvedValue(textResponse("nei", 400));

    const { ConflictError, updateSubjectTopics } = await load();

    const feil = await updateSubjectTopics(emne, []).catch((e: unknown) => e);

    expect(feil).toBeInstanceOf(Error);
    expect(feil).not.toBeInstanceOf(ConflictError);
    expect((feil as Error).message).toBe("Failed to update subject s-1");
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateSubjectTopics } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectTopics(emne, [])).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });

  /**
   * 403 er «du kan bare redigere emner du underviser» - en gyldig økt som møter en
   * eierskapsregel, ikke et dødt token.
   */
  it("beholder økten når serveren svarer 403", async () => {
    fetchMock.mockResolvedValue(emptyResponse(403));

    const { getSession, storeSession, updateSubjectTopics } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectTopics(emne, [])).rejects.toThrow();

    expect(getSession().token).toBe("abc123");
  });
});

describe("updateTopicOrder", () => {
  it("sender bare rekkefølgen, ikke hele emnet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicOrder } = await load();
    await updateTopicOrder("s-1", ["t-2", "t-1"]);

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1/topics/order`);
    expect(initOf(fetchMock).method).toBe("PUT");
    expect(bodyOf(fetchMock)).toEqual({ topicIds: ["t-2", "t-1"] });
  });

  it("beholder rekkefølgen den fikk", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicOrder } = await load();
    await updateTopicOrder("s-1", ["c", "a", "b"]);

    expect(bodyOf<{ topicIds: string[] }>(fetchMock).topicIds).toEqual(["c", "a", "b"]);
  });

  it("kaster når rekkefølgen avvises", async () => {
    fetchMock.mockResolvedValue(textResponse("nei", 400));

    const { updateTopicOrder } = await load();

    await expect(updateTopicOrder("s-1", [])).rejects.toThrow(
      "Failed to reorder topics on subject s-1"
    );
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateTopicOrder } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateTopicOrder("s-1", [])).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("updateTopicState", () => {
  it("sender flagget som en patch mot det ene temaet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isHidden: true });

    expect(urlOf(fetchMock)).toBe(`${API}/api/Subjects/s-1/topics/t-1`);
    expect(initOf(fetchMock).method).toBe("PATCH");
    expect(bodyOf(fetchMock)).toEqual({ isHidden: true });
  });

  /**
   * Et utelatt flagg lar serveren la feltet stå. Sendte tjenesten begge hver gang,
   * ville det å skjule et tema også skrevet slettetilstanden på nytt.
   */
  it("sender bare flaggene den fikk", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isDeleted: true });

    expect(bodyOf(fetchMock)).toEqual({ isDeleted: true });
  });

  it("kan sende begge flaggene på én gang", async () => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateTopicState } = await load();
    await updateTopicState("s-1", "t-1", { isHidden: true, isDeleted: false });

    expect(bodyOf(fetchMock)).toEqual({ isHidden: true, isDeleted: false });
  });

  it("kaster med tema-id-en når endringen avvises", async () => {
    fetchMock.mockResolvedValue(textResponse("nei", 404));

    const { updateTopicState } = await load();

    await expect(updateTopicState("s-1", "t-1", { isHidden: true })).rejects.toThrow(
      "Failed to update topic t-1"
    );
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateTopicState } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateTopicState("s-1", "t-1", { isHidden: true })).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

describe("updateSubjectPeople", () => {
  it("sender staben til sitt eget endepunkt", async () => {
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
   * Én form for «ingen assistent». Den vanlige emneoppdateringen kan ikke uttrykke det
   * i det hele tatt, fordi null der betyr «la feltet stå».
   */
  it.each([
    ["null", null],
    ["tom streng", ""],
  ])("gjør %s om til ingen assistent", async (_navn, assistent) => {
    fetchMock.mockResolvedValue(emptyResponse(200));

    const { updateSubjectPeople } = await load();
    await updateSubjectPeople("s-1", "pnikolic", assistent);

    expect(bodyOf(fetchMock)).toEqual({ lecturer: "pnikolic", assistant: null });
  });

  it("kaster med emne-id-en når staben avvises", async () => {
    fetchMock.mockResolvedValue(textResponse("finnes ikke", 400));

    const { updateSubjectPeople } = await load();

    await expect(updateSubjectPeople("s-1", "ingen", null)).rejects.toThrow(
      "Failed to update staff on subject s-1"
    );
  });

  it("dropper økten når serveren avviser tokenet", async () => {
    fetchMock.mockResolvedValue(emptyResponse(401));

    const { getSession, storeSession, updateSubjectPeople } = await load();

    storeSession("abc123", { username: "pnikolic" });
    await expect(updateSubjectPeople("s-1", "pnikolic", null)).rejects.toThrow();

    expect(getSession()).toEqual({ token: null, user: null });
  });
});

/**
 * Alle skrivekallene går gjennom den samme headerbyggeren. Innholdstypen og tokenet
 * hører sammen: et skrivekall uten token er 401, og uten json-headeren 415.
 */
describe("skrivekallene", () => {
  const kall = {
    updateSubjectTopics: (s: Tjenester) => s.updateSubjectTopics(makeSubject(), []),
    updateTopicOrder: (s: Tjenester) => s.updateTopicOrder("s-1", []),
    updateTopicState: (s: Tjenester) => s.updateTopicState("s-1", "t-1", { isHidden: true }),
    updateSubjectPeople: (s: Tjenester) => s.updateSubjectPeople("s-1", "pnikolic", null),
  };

  it.each(Object.keys(kall) as (keyof typeof kall)[])(
    "%s sender json og tokenet",
    async (navn) => {
      fetchMock.mockResolvedValue(emptyResponse(200));

      const tjenester = await load();
      tjenester.storeSession("abc123", { username: "pnikolic" });

      await kall[navn](tjenester);

      expect(headersOf(fetchMock)["Content-Type"]).toBe("application/json");
      expect(headersOf(fetchMock).Authorization).toBe("Bearer abc123");
    }
  );
});
