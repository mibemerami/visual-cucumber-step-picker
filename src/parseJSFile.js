const fs = require('fs');
const ts = require('typescript');

const cucumberStepKeywords = ['Given', 'When', 'Then', 'And', 'But']

// var sourceCode = "console.log(\"hello world\")";
let sourceCode = fs.readFileSync('E:/PC/development/nodeJs/atlassian-docu-control-questions/specs/features/step_definitions/loginSteps.js', {encoding: 'UTF-8'})
let tsSourceFile = ts.createSourceFile(__filename, sourceCode, ts.ScriptTarget.Latest);
console.log(tsSourceFile)

let stepDefinitions = []
for (let statement of tsSourceFile.statements) {
    let funcName = statement && statement.expression && statement.expression.expression && statement.expression.expression.escapedText
    let argOne = statement && statement.expression && statement.expression.arguments[0] && statement.expression.arguments[0].text
    if (typeof (funcName) !== 'undefined' || typeof (funcName) !== 'undefined')
        if (cucumberStepKeywords.includes(funcName))
            stepDefinitions.push({funcName, argOne})
}
console.log(stepDefinitions)

