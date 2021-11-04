import path from "path";
import fs from "fs";
import * as esbuild from "esbuild";
import { execSync } from "child_process";
import download from "download-tarball";

// Assume single file as entrypoint
// Assume no transitive dependencies are required at build time
// Upload resulting asset to CDN

export default async function handler(req, res) {
  const pkgs = ["react", "react-dom", "react-tabs", "lodash"];
  const modules = path.join(__dirname, "node_modules");
  execSync(`rm -rf ${modules}`);
  await fs.promises.mkdir(modules, {
    recursive: true,
  });

  const install = async (pkgName) => {
    const tarballUrl = execSync(`npm view ${pkgName} dist.tarball`).toString();
    await download({
      url: tarballUrl,
      dir: `${modules}/${pkgName}`,
    });
  };
  await Promise.all(pkgs.map(install));

  let { outputFiles } = esbuild.buildSync({
    bundle: true,
    minify: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    stdin: {
      contents: `
        import ReactDOM from 'react-dom';
        import { Tab, Tabs, TabList, TabPanel } from 'react-tabs/package';
        import 'react-tabs/package/style/react-tabs.css';

        const MyTabs = () => (
          <Tabs>
            <TabList>
              <Tab>Title 1</Tab>
              <Tab>Title 2</Tab>
            </TabList>
            <TabPanel>
              <h2>Any content 1</h2>
            </TabPanel>
            <TabPanel>
              <h2>Any content 2</h2>
            </TabPanel>
          </Tabs>
        );

        ReactDOM.render(<MyTabs />, document.querySelector('#root'))
      `,
      resolveDir: modules,
      sourcefile: "esbuild-entrypoint.js",
      loader: "tsx",
    },
    outdir: "./build",
    format: "iife",
    write: false,
  });

  res.status(200).json(outputFiles.map((e) => e.text));

  // cache assets with node-cloudfare
}
