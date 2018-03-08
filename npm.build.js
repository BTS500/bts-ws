let shell = require("shelljs");
let execSync = require("child_process").execSync;
let fs = require("fs");
let path = require("path");
let rm = require("rimraf");
let chalk = require("chalk");

console.log(chalk.red("Build the npm publish package start ... \n"));

rm(path.resolve("./dist/nodejs/"), (err) => {
    if (err) throw err;

    let out = execSync("babel ./src --out-dir ./dist/nodejs", {cwd: process.cwd()});
    console.log(chalk.cyan(out.toString("UTF-8")));

    if (fs.existsSync(path.resolve("./package.json"))) {
        let package = require(path.resolve("./package.json"));
        package.main = "index.js";
        fs.writeFileSync(path.join("./dist/nodejs/", "package.json"), JSON.stringify(package), "UTF-8");
    }

    shell.cp("-R", "./README.md", "./dist/nodejs/");
    shell.cp("-R", "./docs", "./dist/nodejs/");
    shell.cp("-R", "./LICENSE", "./dist/nodejs/");

    console.log(chalk.green("The npm package build success."));
});


