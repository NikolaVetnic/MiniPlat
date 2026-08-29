import { Fragment } from "react";

import Highlight from "../components/Highlight/Highlight";
import YouTubeEmbed from "../components/YouTubeEmbed/YouTubeEmbed";
import type { GuideBlock, RichText as RichTextSegments } from "./types";

/**
 * The guide pages used to be Serbian prose written straight into JSX, which left no way to
 * translate them. The prose now lives in the locale files as segments, and this renders
 * them back into the same markup - bold, italics and the coloured Highlight badges.
 */

const Segments = ({ segments }: { segments: RichTextSegments }) => (
  <>
    {segments.map((segment, index) => {
      if (typeof segment === "string") return segment;

      const text = segment.italic ? <i>{segment.text}</i> : segment.text;

      return (
        <Fragment key={index}>
          {segment.highlight ? (
            <Highlight color={segment.highlight} textColor={segment.textColor}>
              {text}
            </Highlight>
          ) : segment.bold ? (
            <strong>{text}</strong>
          ) : (
            text
          )}
        </Fragment>
      );
    })}
  </>
);

const Block = ({ block }: { block: GuideBlock }) => {
  switch (block.kind) {
    case "h2":
      return (
        <h2>
          <Segments segments={block.content} />
        </h2>
      );
    case "h3":
      return (
        <h3>
          <Segments segments={block.content} />
        </h3>
      );
    case "p":
      return (
        <p>
          <Segments segments={block.content} />
        </p>
      );
    case "ul":
      return (
        <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
          {block.items.map((item, index) => (
            <li key={index} style={{ marginBottom: "0.75rem" }}>
              <Segments segments={item} />
            </li>
          ))}
        </ul>
      );
    case "video":
      return (
        <YouTubeEmbed
          videoId={block.videoId}
          maxWidth="640px"
          title={block.title}
        />
      );
  }
};

const Guide = ({ blocks }: { blocks: GuideBlock[] }) => (
  <div>
    {blocks.map((block, index) => (
      <Block key={index} block={block} />
    ))}
  </div>
);

export default Guide;
