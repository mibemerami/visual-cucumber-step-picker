// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as contentProvider from './lib/contentProvider';
import {basename} from 'path';
const pf = require('./lib/projectFiles');




export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "visualcucumbersteppicker" is now active!');

	console.log('Your project: ' + vscode.workspace.rootPath);
	let subfolders = pf.getAllSubfolders(vscode.workspace.rootPath, [], ['node_modules','.git']);
	let stepsFolder = subfolders.filter((name: string) => basename(name) === 'step_definitions')[0];

	let vcspTreeProvider = new contentProvider.StepsTreeProvider(stepsFolder);
	let vcspTreeView = vscode.window.createTreeView('vcspTree', { treeDataProvider: vcspTreeProvider } );
	vcspTreeView.onDidChangeSelection(evnt => {
		let selectedSteps = evnt.selection.map(selectObj => selectObj.label);
		console.log('The selection in the treeView changed. Selected: ');
		vscode.env.clipboard.writeText(selectedSteps[0]||'');
	});

	vscode.commands.registerCommand('vcspTree.refreshEntry', () => vcspTreeProvider.refresh());
	vscode.commands.registerCommand('vcspTree.addEntry', () => console.log('addEntry has been called'));
	vscode.commands.registerCommand('vcspTree.editEntry', () => console.log('editEntry has been called'));


}

// this method is called when your extension is deactivated
export function deactivate() {}
