// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as contProvider from './contentProvider';
import {join} from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "visualcucumbersteppicker" is now active!');

	// vscode.window.registerTreeDataProvider('vscpTree', new contProvider.DepNodeProvider(join(vscode.env.appRoot, '/specs/features/step_definitions/')));
	vscode.window.registerTreeDataProvider('vscpTree', new contProvider.DepNodeProvider(join('','E:/PC/development/nodeJs/atlassian-docu-control-questions/specs/features/step_definitions')));

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.vcsp', () => {
		// The code you place here will be executed every time your command is executed
		vscode.window.showQuickPick(['the user says hello', 'to the whole wolrd']);
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
		vscode.window.showInformationMessage('Your project: ' + vscode.env.appRoot);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}