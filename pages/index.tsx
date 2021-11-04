import React from "react";
import { useEffect } from "react";

export async function getServerSideProps() {
  const assets = await fetch("http://localhost:3000/api").then((r) => r.json());
  return {
    props: {
      assets,
    },
  };
}

export default function Home({ assets }) {
  useEffect(() => {
    const [js, css] = assets;
    globalThis.React = React;
    const style = document.createElement("style");
    style.innerText = css;
    const script = document.createElement("script");
    script.innerHTML = js;
    document.body.appendChild(style);
    document.body.appendChild(script);
  }, []);
  return <div id="root"></div>;
}
