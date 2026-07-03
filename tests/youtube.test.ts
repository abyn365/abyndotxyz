import { describe, expect, it } from "vitest";
import { normalizeString, pickBestResult } from "../lib/music/youtube";

describe("youtube search helpers", () => {
  describe("normalizeString", () => {
    it("converts to lowercase and collapses spaces", () => {
      expect(normalizeString("  Hello   WORLD  ")).toBe("hello world");
    });

    it("replaces '#' with space", () => {
      expect(normalizeString("Why Do U Lie #Back2Basics")).toBe("why do u lie back2basics");
    });

    it("removes other punctuation characters", () => {
      expect(normalizeString("Hello! (feat. World) - Single")).toBe("hello feat world single");
    });
  });

  describe("pickBestResult", () => {
    it("selects official/Topic uploads when artist matches", () => {
      const results = [
        { videoId: "E3-tmG0SU7k", title: "Opus", author: "FSTVLST - Topic" },
        { videoId: "XhZDwdekk-0", title: "Jefferson", author: "FSTVLST - Topic" },
        { videoId: "JvtOVJIopCg", title: "FSTVLST - Jefferson (Lirik Video)", author: "GUWA AHMAD" },
      ];

      const best = pickBestResult(results, "Jefferson", "FSTVLST");
      expect(best).not.toBeNull();
      expect(best?.videoId).toBe("XhZDwdekk-0"); // Matches the song Jefferson on the Topic channel
    });

    it("correctly matches titles containing hashtags and punctuation", () => {
      const results = [
        { videoId: "ePALXjugPnA", title: "EnemyDavy why do u lie (slowed)", author: "Vitim" },
        { videoId: "83WKjbbtOJk", title: "EnemyDavy - why do u lie #back2basics", author: "ENEMYDAVY" },
      ];

      const best = pickBestResult(results, "Why Do U Lie #Back2Basics", "EnemyDavy");
      expect(best).not.toBeNull();
      expect(best?.videoId).toBe("83WKjbbtOJk"); // Original upload match
    });

    it("excludes video IDs specified in excludeVideoIds", () => {
      const results = [
        { videoId: "ePALXjugPnA", title: "EnemyDavy why do u lie (slowed)", author: "Vitim" },
        { videoId: "83WKjbbtOJk", title: "EnemyDavy - why do u lie #back2basics", author: "ENEMYDAVY" },
      ];

      // If we exclude the original video, it should fall back to the other
      const best = pickBestResult(results, "Why Do U Lie #Back2Basics", "EnemyDavy", ["83WKjbbtOJk"]);
      expect(best).not.toBeNull();
      expect(best?.videoId).toBe("ePALXjugPnA");
    });

    it("returns null if all results are excluded", () => {
      const results = [
        { videoId: "ePALXjugPnA", title: "EnemyDavy why do u lie (slowed)", author: "Vitim" },
      ];

      const best = pickBestResult(results, "Why Do U Lie #Back2Basics", "EnemyDavy", ["ePALXjugPnA"]);
      expect(best).toBeNull();
    });
  });
});
