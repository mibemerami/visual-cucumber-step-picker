// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as contentProvider from './lib/contentProvider';
import * as path from 'path';
const pf = require('./lib/projectFiles');




export function activate(context: vscode.ExtensionContext) {
	// Find stepdefinitions folder
	let subfolders = pf.getAllSubfolders(vscode.workspace.rootPath, [], ['node_modules','.git']);
	let stepsFolder = subfolders.filter((name: string) => path.basename(name) === 'step_definitions')[0];

	// Add treeView, populated with items, to vscode
	let vcspTreeProvider = new contentProvider.StepsTreeProvider(stepsFolder);
	let vcspTreeView = vscode.window.createTreeView('vcspTree', { treeDataProvider: vcspTreeProvider } );

	// Handle events
	vcspTreeView.onDidChangeSelection(evnt => { 
		vcspTreeProvider.setSelectedTreeItem(evnt.selection[0]);  
		vscode.env.clipboard.writeText(evnt.selection[0].label||'');
	});

	// Define commands 
	vscode.commands.registerCommand('vcspTree.refreshEntry', () => vcspTreeProvider.refresh());
	vscode.commands.registerCommand('vcspTree.addEntry', () => console.log('addEntry has been called'));
	vscode.commands.registerCommand('vcspTree.stepsDir', () => {
		console.log('stepsDir has been called');
		vscode.window.showOpenDialog(
				{canSelectFiles: false, canSelectFolders: true, canSelectMany: false}
			).then(folder => {
				console.log('selected folder: ', folder);
				if (folder) {
					let normalizedPath = process.platform === 'win32' 
						 ? folder[0].path.split('/').reduce((a, x) => path.join(a, x), '')
						 : folder[0].path;
					vcspTreeProvider.setTargetFolder(normalizedPath);
					vcspTreeProvider.refresh();
				}
			});
	});
	vscode.commands.registerCommand('vcspTree.writeStep', (item: vscode.TreeItem) => {
		console.log('editEntry has been called');
		let editor = vscode.window.activeTextEditor;
		if(editor){
			console.log('selections: ', editor.selections);
			editor.edit(textEdit => {
				if (editor) {
					editor.selections.forEach(selection => {
						textEdit.delete(selection);
						textEdit.insert(selection.start, item.label || '');
					});
				}
			});
		} else {
			vscode.window.showInformationMessage('No active editor, to insert text.');
		}
	});

}

// this method is called when the extension is deactivated
export function deactivate() {}
