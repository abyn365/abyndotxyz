const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  class ClickSpark extends HTMLElement {
    private svg: SVGElement | null = null;

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this.shadowRoot!.innerHTML = this.createSpark();
      this.svg = this.shadowRoot!.querySelector("svg");
      document.addEventListener("click", this.handleEvent.bind(this));
    }

    disconnectedCallback() {
      document.removeEventListener("click", this.handleEvent.bind(this));
    }

    handleEvent(e: MouseEvent) {
      this.setSparkPosition(e);
      this.animateSpark();
    }

    private animateSpark() {
      if (!this.svg) return;
      
      const sparks = Array.from(this.svg.children);
      const size = parseInt(sparks[0].getAttribute("y1") || "30");
      const offset = size / 2 + "px";

      const keyframes = (i: number) => {
        const deg = `calc(${i} * (360deg / ${sparks.length}))`;

        return [
          {
            strokeDashoffset: size * 3,
            transform: `rotate(${deg}) translateY(${offset})`,
          },
          {
            strokeDashoffset: size,
            transform: `rotate(${deg}) translateY(0)`,
          },
        ];
      };

      const options: KeyframeAnimationOptions = {
        duration: 660,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards",
      };

      sparks.forEach((spark, i) => spark.animate(keyframes(i), options));
    }

    private setSparkPosition(e: MouseEvent) {
      // Get exact click position
      const x = e.clientX;
      const y = e.clientY;
      
      // Center the spark on the click position
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
    }

    private createSpark() {
      return `
        <style>
          :host {
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 99999;
            transform: translate(-50%, -50%);
          }
          svg {
            overflow: visible;
          }
        </style>
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" stroke="var(--click-spark-color, #ff6347)" transform="rotate(-20)">
          ${Array.from(
            { length: 8 },
            () => `<line x1="50" y1="30" x2="50" y2="4" stroke-dasharray="30" stroke-dashoffset="30" style="transform-origin: center" />`
          ).join("")}
        </svg>
      `;
    }
  }

  if (!customElements.get('click-spark')) {
    customElements.define("click-spark", ClickSpark);
  }
}

export class ClickSpark {}