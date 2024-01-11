import fs from "fs";
import { rimraf } from "rimraf";
import { mkdirp } from "mkdirp";
import { walk } from "walk";
import chalk from "chalk";
import Table from "cli-table";
import path from "path";
import draftLog from "draftlog";
draftLog.into(console);

const removeDir = async (dir) => {
  const res = await rimraf(dir);
};

const printDirs = (dir) => {
  return new Promise((resolve, reject) => {
    const table = new Table({
      head: ["Path", "Created"],
      colWidth: [120, 180],
    });

    const walker = walk(dir);

    walker.on("directory", (root, dirStats, next) => {
      table.push(["🪐 " + path.join(chalk.red.italic(root), chalk.blue.bold(dirStats.name)), dirStats.ctime]);
      next();
    });

    walker.on("end", () => {
      console.log(table.toString());
      resolve();
    });
  });
};

const progress = () => {
  return new Promise((resolve) => {
    const log = console.draft("Starting soon...");
    let i = 0;
    const intervalId = setInterval(() => {
      i++;

      if (i === 4) {
        clearInterval(intervalId);
        log("Starting now");
        resolve();
      } else {
        log(`Starting in ${4 - i}s`);
      }
    }, 1000);
  });
};

(async () => {
  await progress();
  await removeDir("tmp");
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      await mkdirp(`tmp/a${i}/b${j}`);
      await fs.writeFile(`tmp/a${i}/b${j}/t${i}${j}.txt`, `${i} ${j}`, (err) => {
        if (err) throw err;
      });
    }
  }
  await printDirs("./tmp");
})();

console.log(
  [].reduce(() => {
    console.log("test");
    return 2;
  }, 0)
);
