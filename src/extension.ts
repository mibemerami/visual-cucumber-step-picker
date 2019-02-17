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
	vcspTreeView.onDidChangeSelection(evnt => {  // TODO: adapt, bacause multi selections seems not possible here
		vcspTreeProvider.setSelectedTreeItem(evnt.selection[0]);  
		let selectedSteps = evnt.selection.map(selectObj => selectObj.label);
		console.log('The selection in the treeView changed. ');
		vscode.env.clipboard.writeText(selectedSteps[0]||'');
	});

	vscode.commands.registerCommand('vcspTree.refreshEntry', () => vcspTreeProvider.refresh());
	vscode.commands.registerCommand('vcspTree.addEntry', () => console.log('addEntry has been called'));
	vscode.commands.registerTextEditorCommand('vcspTree.editEntry', (textEditor, edit) => {
		console.log('editEntry has been called');
		// let currentSelection: vscode.Selection|undefined = vscode.window.activeTextEditor 
		// 	&& vscode.window.activeTextEditor.selection;
		let currentPositions: vscode.Position[]  = 
			textEditor.selections.map(select => new vscode.Position(select.start.line, select.start.character));
		// if(currentSelection) {
		// 	let currentPosition = new vscode.Position(currentSelection.start.line, currentSelection.start.line);
		// 	vscode.window.activeTextEditor && vscode.window.activeTextEditor.edit(vscode.TextEdit.Te)
		// }
		
		let selectedItem = vcspTreeProvider.getSelectedTreeItem();
		if (selectedItem){
			let insertText = selectedItem.label || '' ;
			currentPositions.forEach(position => {
				textEditor.edit(edit => edit.insert(position, insertText));
			});
		}
	});


}

// this method is called when your extension is deactivated
export function deactivate() {}
