/**
 * The shape both locale files must have. Declared here rather than inferred from one of
 * them with `typeof`: the guide blocks are heterogeneous arrays, and inference turns those
 * into unions that the other file can never quite satisfy. The two files are kept in step
 * by dictionaries.test.ts, which compares their key paths.
 */

/** The languages the client can be switched to. */
export type Language = "sr" | "no" | "en";

/** A run of text inside a paragraph, optionally emphasised or badged. */
export interface RichSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  /** Background of the Highlight badge; absent means plain text. */
  highlight?: string;
  textColor?: string;
}

/** A paragraph is plain strings interleaved with the runs that need markup. */
export type RichText = Array<string | RichSegment>;

export type GuideBlock =
  | { kind: "h2" | "h3" | "p"; content: RichText }
  | { kind: "ul"; items: RichText[] }
  | { kind: "video"; videoId: string; title: string };

export interface Guide {
  blocks: GuideBlock[];
}

export interface SidebarCaptions {
  mainMenu: string;
  subjects: string;
  home: string;
  levels: string[];
  semester: string[];
  years: string[];
  /** Template with a {year} placeholder, e.g. "II godina" / "2. år". */
  yearLabel: string;
}

export interface TopicCaptions {
  buttons: {
    addMaterial: string;
    cancel: string;
    delete: string;
    edit: string;
    hide: string;
    putBack: string;
    save: string;
    show: string;
  };
  description: string;
  link: string;
  materials: string;
  status: {
    active: string;
    hidden: string;
    deleted: string;
    hiddenAndDeleted: string;
  };
  title: string;
  titles: { create: string; update: string };
  updatedAt: string;
}

export interface Dictionary {
  /** BCP 47 tag, used for date formatting and the <html lang> attribute. */
  locale: string;
  /** The language's own name, so the picker reads the same whichever language is on. */
  languageName: string;
  captions: {
    companyName: string;
    title: string;
    titleShort: string;
    institution: string;
  };
  components: {
    cards: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
        lecturer: string;
        department: string;
        loading: string;
        error: string;
      };
      subject: {
        active: { false: string; true: string };
        assistant: string;
        buttons: { cancel: string; edit: string; ok: string };
        code: string;
        level: { caption: string; undergraduate: string; master: string };
        lecturer: string;
        loading: string;
        saveFailed: string;
        semester: { caption: string; summer: string; winter: string };
        test: string;
        title: string;
        year: {
          caption: string;
          one: string;
          two: string;
          three: string;
          /** Template with {year} and {semester} placeholders. */
          withSemester: string;
        };
      };
      topic: TopicCaptions;
    };
    language: { label: string };
    modals: {
      topic: {
        errors: { titleIsMandatory: string; descriptionIsMandatory: string };
      };
    };
    navbar: {
      buttons: { login: string; logout: string };
      loggedInAs: string;
    };
    sidebar: SidebarCaptions;
  };
  pages: {
    home: {
      adminControlPanel: string;
      buttons: { dumpDatabaseAsYaml: string };
      greetings: { lecturers: string; students: string };
      home: string;
      guides: { students: Guide; lecturers: Guide };
    };
    login: {
      buttons: { login: string };
      footer: string;
      error: string;
      header: string;
      loading: string;
      placeholders: { username: string; password: string };
    };
    notFound: {
      buttons: { return: string };
      description: string;
      title: string;
    };
    subject: {
      buttons: { addTopic: string };
      saveFailed: string;
      saveConflict: string;
    };
  };
}
