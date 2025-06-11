const subjectsDummmyData = [
  {
    id: "eggw",
    code: "ST101", // jedinstvena sifra predmeta ali ne zelimo da to bude ID
    title: "Pedagogija",
    description: "Opis predmeta.",
    level: "undergrad",
    year: 1, // undergrad: [1, 3], master [1, 2], must validate according to type
    lecturer: "USRa",
    assistant: null,
    owners: ["USRa"], // this will be deleted
    topics: [
      {
        id: "asdw",
        title: "Prvo predavanje iz Pedagogije",
        description: "Video snimak prvog predavanja.",
        materials: [
          {
            id: "asdx",
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
          },
        ],
        isHidden: false,
        createdAt: "2023-05-10T14:30:00Z",
        createdBy: "admin",
        updatedAt: "2023-09-10T14:30:00Z",
        updatedBy: "admin",
        deletedAt: null, // TimeDate
        deletedBy: null,
      },
      {
        title: "Prve vežbe iz Pedagogije",
        description: "Video snimak prvih vežbi.",
        materials: [
          {
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
        ],
        createdAt: "2024-02-15T09:00:00Z",
        createdBy: "admin",
        updatedAt: "2024-02-15T09:00:00Z",
        updatedBy: "admin",
      },
    ],
  },
  {
    id: "zuak",
    title: "Psihologija",
    description: "Opis predmeta.",
    level: "undergrad",
    year: 2,
    lecturer: "USRa",
    assistant: "USRb",
    owners: ["USRa", "USRb"],
    topics: [
      {
        title: "Psihologija: Prvo predavanje",
        description: "Video snimak prvog predavanja.",
        materials: [
          {
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
        ],
        createdAt: "2024-11-01T17:45:00Z",
        createdBy: "admin",
        updatedAt: "2025-03-01T17:45:00Z",
        updatedBy: "admin",
      },
      {
        title: "Psihologija: Prve vežbe",
        description: "Video snimak prvih vežbi.",
        materials: [
          {
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
        ],
        createdAt: "2025-02-15T09:00:00Z",
        createdBy: "admin",
        updatedAt: "2025-03-15T09:00:00Z",
        updatedBy: "admin",
      },
    ],
  },
  {
    id: "w72u",
    title: "Filozofija sa etikom",
    description: "Opis predmeta.",
    level: "master",
    year: 1,
    lecturer: "USRb",
    assistant: null,
    owners: ["USRb"],
    topics: [
      {
        title: "Prvo predavanje na temu Aristotela",
        description: "Video snimak prvog predavanja.",
        materials: [
          {
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
        ],
        createdAt: "2023-02-15T09:00:00Z",
        createdBy: "admin",
        updatedAt: "2024-12-15T09:00:00Z",
        updatedBy: "admin",
      },
      {
        title: "Prve vežbe na temu Aristotela",
        description: "Video snimak prvih vežbi.",
        materials: [
          {
            description: "Video snimak predavanja",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
          {
            description: "Video snimak vezbi",
            link: "https://www.youtube.com/watch?v=zi69pFkawQA",
            isHidden: false,
            isDeleted: false,
          },
        ],
        createdAt: "2024-11-15T09:00:00Z",
        createdBy: "admin",
        updatedAt: "2024-12-15T09:00:00Z",
        updatedBy: "admin",
      },
    ],
  },
];

export default subjectsDummmyData;
