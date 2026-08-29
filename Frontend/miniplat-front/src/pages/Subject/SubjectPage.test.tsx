import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSubject, makeTopic } from "../../test/fixtures";
import { signIn, signOut } from "../../test/render";
import { UserProvider } from "../../contexts/UserContext";
import {
  ConflictError,
  fetchSubjects,
  updateSubjectTopics,
  updateTopicOrder,
  updateTopicState,
} from "../../services/subjectsService";
import { fetchLecturer, fetchLecturers } from "../../services/lecturersService";
import sr from "../../locales/sr.json";
import SubjectPage from "./SubjectPage";
import type { Subject } from "../../types/api";

// importActual keeps ConflictError as the real class; otherwise the instanceof check in
// the page would never match and the conflict message would be untestable.
vi.mock("../../services/subjectsService", async (importActual) => ({
  ...(await importActual<typeof import("../../services/subjectsService")>()),
  fetchSubjects: vi.fn(),
  updateSubjectTopics: vi.fn(),
  updateTopicOrder: vi.fn(),
  updateTopicState: vi.fn(),
}));

vi.mock("../../services/lecturersService", () => ({
  fetchLecturer: vi.fn(),
  fetchLecturers: vi.fn(),
}));

const fetchCatalogue = vi.mocked(fetchSubjects);
const saveTopics = vi.mocked(updateSubjectTopics);
const saveOrder = vi.mocked(updateTopicOrder);
const saveTopicState = vi.mocked(updateTopicState);

const cpt = sr.pages.subject;
const topicCpt = sr.components.cards.topic;

const subject = (over: Partial<Subject> = {}) =>
  makeSubject({
    id: "s-1",
    title: "Psihologija",
    topics: [
      makeTopic({ id: "t-1", title: "Prva tema", order: 0 }),
      makeTopic({ id: "t-2", title: "Druga tema", order: 1 }),
    ],
    ...over,
  });

const show = (subjectId = "s-1") =>
  render(
    <MemoryRouter initialEntries={[`/subjects/${subjectId}`]}>
      <UserProvider>
        <Routes>
          <Route
            path="/subjects/:subjectId"
            element={<SubjectPage onLogout={vi.fn()} />}
          />
          <Route path="/home" element={<div>home page</div>} />
        </Routes>
      </UserProvider>
    </MemoryRouter>
  );

const showAndWait = async (subjectId = "s-1") => {
  const rendered = show(subjectId);
  await screen.findByRole("heading", { level: 1 });
  return rendered;
};

beforeEach(() => {
  signOut();
  vi.mocked(fetchLecturer).mockResolvedValue(null);
  vi.mocked(fetchLecturers).mockResolvedValue([]);

  fetchCatalogue.mockReset().mockResolvedValue([subject()]);
  saveTopics.mockReset().mockResolvedValue(undefined);
  saveOrder.mockReset().mockResolvedValue(undefined);
  saveTopicState.mockReset().mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  signOut();
  vi.restoreAllMocks();
});

describe("SubjectPage, what is shown", () => {
  it("shows the subject and the topics it has", async () => {
    await showAndWait();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Psihologija");
    expect(screen.getByText("Prva tema")).toBeDefined();
    expect(screen.getByText("Druga tema")).toBeDefined();
  });

  /**
   * An id that names no subject used to render a blank page and then throw on
   * subject.title. Now it lands on the home page, the same treatment a route that cannot
   * be served gets.
   */
  it("sends you to the home page when the id names no subject", async () => {
    show("does-not-exist");

    expect(await screen.findByText("home page")).toBeDefined();
  });

  it("sends you to the home page when the subjects could not be fetched", async () => {
    fetchCatalogue.mockRejectedValue(new Error("500"));

    show();

    expect(await screen.findByText("home page")).toBeDefined();
  });

  /**
   * The server sends a visitor no hidden topics anyway. The filter here is the same
   * distinction expressed in the client, for the case where something arrives regardless.
   */
  it("hides hidden and deleted topics from a visitor", async () => {
    fetchCatalogue.mockResolvedValue([
      subject({
        topics: [
          makeTopic({ id: "t-1", title: "Visible" }),
          makeTopic({ id: "t-2", title: "Hidden", isHidden: true }),
          makeTopic({ id: "t-3", title: "Deleted", isDeleted: true }),
        ],
      }),
    ]);

    await showAndWait();

    expect(screen.getByText("Visible")).toBeDefined();
    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.queryByText("Deleted")).toBeNull();
  });

  it("shows them to someone who is signed in", async () => {
    signIn();
    fetchCatalogue.mockResolvedValue([
      subject({
        topics: [
          makeTopic({ id: "t-1", title: "Visible" }),
          makeTopic({ id: "t-2", title: "Hidden", isHidden: true }),
        ],
      }),
    ]);

    await showAndWait();

    expect(screen.getByText("Hidden")).toBeDefined();
  });

  it("does not offer to add a topic to a visitor", async () => {
    await showAndWait();

    expect(screen.queryByRole("button", { name: cpt.buttons.addTopic })).toBeNull();
  });

  it("offers it to someone who is signed in", async () => {
    signIn();

    await showAndWait();

    expect(screen.getByRole("button", { name: cpt.buttons.addTopic })).toBeDefined();
  });
});

describe("SubjectPage and the topics", () => {
  beforeEach(() => {
    signIn();
  });

  it("hides a topic through its own endpoint", async () => {
    await showAndWait();

    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.hide })[0]);

    await waitFor(() =>
      expect(saveTopicState).toHaveBeenCalledWith("s-1", "t-1", { isHidden: true })
    );
    expect(saveTopics).not.toHaveBeenCalled();
  });

  it("marks a topic for deletion through the same endpoint", async () => {
    await showAndWait();

    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.delete })[0]);

    await waitFor(() =>
      expect(saveTopicState).toHaveBeenCalledWith("s-1", "t-1", { isDeleted: true })
    );
  });

  /** The flag is turned over: a hidden topic becomes visible again. */
  it("shows a hidden topic again", async () => {
    fetchCatalogue.mockResolvedValue([
      subject({ topics: [makeTopic({ id: "t-1", title: "Hidden", isHidden: true })] }),
    ]);

    await showAndWait();

    fireEvent.click(screen.getByRole("button", { name: topicCpt.buttons.show }));

    await waitFor(() =>
      expect(saveTopicState).toHaveBeenCalledWith("s-1", "t-1", { isHidden: false })
    );
  });

  it("shows the change at once, without waiting for the server", async () => {
    await showAndWait();

    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.hide })[0]);

    expect(screen.getAllByRole("button", { name: topicCpt.buttons.show })).toHaveLength(1);
  });

  /**
   * Only the order changed, so it goes to its own endpoint rather than sending the whole
   * graph and having the server rebuild every topic and material.
   */
  it("moves a topic through the reorder endpoint", async () => {
    await showAndWait();

    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    await waitFor(() => expect(saveOrder).toHaveBeenCalledWith("s-1", ["t-2", "t-1"]));
    expect(saveTopics).not.toHaveBeenCalled();
  });

  it("sends the whole graph when a topic is edited", async () => {
    await showAndWait();

    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.edit })[0]);
    fireEvent.change(screen.getByDisplayValue("Prva tema"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: topicCpt.buttons.save }));

    await waitFor(() => expect(saveTopics).toHaveBeenCalledTimes(1));

    const [, topics] = saveTopics.mock.calls[0];

    expect(topics.map((topic) => topic.title)).toEqual(["Changed", "Druga tema"]);
  });

  it("puts a new topic last", async () => {
    await showAndWait();

    fireEvent.click(screen.getByRole("button", { name: cpt.buttons.addTopic }));
    fireEvent.change(screen.getByLabelText(/Naslov/), {
      target: { value: "Treća tema" },
    });
    fireEvent.change(screen.getByLabelText(new RegExp(topicCpt.description)), {
      target: { value: "Opis teme" },
    });
    fireEvent.click(screen.getByRole("button", { name: topicCpt.buttons.save }));

    await waitFor(() => expect(saveTopics).toHaveBeenCalledTimes(1));

    const [, topics] = saveTopics.mock.calls[0];

    expect(topics.map((topic) => topic.title)).toEqual([
      "Prva tema",
      "Druga tema",
      "Treća tema",
    ]);
  });
});

describe("SubjectPage when the save does not go through", () => {
  beforeEach(() => {
    signIn();
  });

  const editFirstTopic = () => {
    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.edit })[0]);
    fireEvent.click(screen.getByRole("button", { name: topicCpt.buttons.save }));
  };

  /**
   * A conflict is not the same as a failure: someone else saved first, and the user has
   * to fetch the newer version rather than simply try again. Hence its own message.
   */
  it("reports a conflict with its own message", async () => {
    saveTopics.mockRejectedValue(new ConflictError("s-1 was changed by someone else"));

    await showAndWait();
    editFirstTopic();

    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe(cpt.saveConflict);
  });

  it("reports an ordinary failure with the ordinary message", async () => {
    saveTopics.mockRejectedValue(new Error("500"));

    await showAndWait();
    editFirstTopic();

    const alert = await screen.findByRole("alert");

    expect(alert.textContent).toBe(cpt.saveFailed);
  });

  it("says so when a reorder was not saved", async () => {
    saveOrder.mockRejectedValue(new Error("400"));

    await showAndWait();
    fireEvent.click(screen.getByRole("button", { name: "↓" }));

    expect((await screen.findByRole("alert")).textContent).toBe(cpt.saveFailed);
  });

  it("says so when a flag was not saved", async () => {
    saveTopicState.mockRejectedValue(new Error("403"));

    await showAndWait();
    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.hide })[0]);

    expect((await screen.findByRole("alert")).textContent).toBe(cpt.saveFailed);
  });

  /** A new action clears the message, so it does not linger after something succeeded. */
  it("clears the message once the next action goes through", async () => {
    saveTopicState.mockRejectedValueOnce(new Error("403"));

    await showAndWait();
    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.hide })[0]);
    await screen.findByRole("alert");

    fireEvent.click(screen.getAllByRole("button", { name: topicCpt.buttons.delete })[0]);

    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
