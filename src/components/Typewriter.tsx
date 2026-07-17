import { useState, useEffect } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
}

export default function Typewriter({ text, speed = 25 }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    setDisplayed("");
    setIsDone(false);

    const timer = setInterval(() => {
      setDisplayed((prev) => {
        if (index >= text.length) {
          clearInterval(timer);
          setIsDone(true);
          return prev;
        }
        const next = prev + text.charAt(index);
        index++;
        return next;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <>
      {displayed}
      <span
        key={isDone ? "cursor-done" : "cursor-typing"}
        className="bio-cursor"
        aria-hidden="true"
      />
    </>
  );
}

interface RotatingTypewriterProps {
  texts: string[];
  speed?: number;
  eraseSpeed?: number;
  delayBetween?: number;
}

export function RotatingTypewriter({
  texts,
  speed = 50,
  eraseSpeed = 30,
  delayBetween = 2000,
}: RotatingTypewriterProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let timer: any;
    const currentFullText = texts[textIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      }, eraseSpeed);
    } else {
      timer = setTimeout(() => {
        setDisplayText((prev) => prev + currentFullText.charAt(charIndex));
        setCharIndex((prev) => prev + 1);
      }, speed);
    }

    if (!isDeleting && charIndex === currentFullText.length) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetween);
    }

    if (isDeleting && displayText === "") {
      clearTimeout(timer);
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % texts.length);
      setCharIndex(0);
    }

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, displayText, textIndex, texts, speed, eraseSpeed, delayBetween]);

  return (
    <>
      {displayText}
      <span className="bio-cursor-infinite" aria-hidden="true" />
    </>
  );
}

