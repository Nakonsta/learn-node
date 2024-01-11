// REVERT PACKAGE.JSON TYPE TO COMMON.JS
// // console.log(process.argv);

// const args = require("yargs")
//   .usage("Usage: $0 <command> [options]")
//   .command("Count", "Count lines in a file")
//   .example("$0 count -f foo.js", "Count the lines in the given file")
//   .alias("f", "file")
//   .nargs("f", 1)
//   .describe("f", "Path to the file")
//   .demandOption("f")
//   .help("h")
//   .alias("h", "help").argv;
// const fs = require("fs");
// const lines = fs.readFileSync(args.file, "utf-8").trim().split("\n").length;

// console.log(lines);

// const readline = require("readline");
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// rl.question("Password? ", (answer) => {
//   console.log(`Your answer: ${answer}`);

//   rl.close();
// });

import inquirer from "inquirer";

const questions = [
  { type: "input", name: "country", message: "What's your country? " },
  { type: "input", name: "age", message: "What's your age? " },
  { type: "password", name: "password", message: "What's your password? " },
];

(async () => {
  const res = await inquirer.prompt(questions);

  console.log(res);
})();
