import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Statusbar für Zeichen- und Wortzählung
    let statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.tooltip = "Char & Wordcount";
    context.subscriptions.push(statusBar);

    // Event Listener für Auswahl-Änderungen
    let disposable = vscode.window.onDidChangeTextEditorSelection(updateStatusBar);
    context.subscriptions.push(disposable);

    function updateStatusBar() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            statusBar.hide();
            return;
        }

        let selection = editor.selection;
        let text = editor.document.getText(selection);

        if (text.length > 0) {
            let wordCount = text.trim().split(/\s+/).length;
            let charCount = text.length;
            statusBar.text = `$(pencil) ${charCount} Zeichen, ${wordCount} Wörter`;
            statusBar.show();
        } else {
            statusBar.hide();
        }
    }

    updateStatusBar();

    // Sidebar hinzufügen
    const treeDataProvider = new GitCommitViewProvider();
    vscode.window.registerTreeDataProvider('textCounterPanel', treeDataProvider);

    // Befehl für den Button
    const openGitCommitPanelCommand = vscode.commands.registerCommand('extension.openGitCommitPanel', () => {
        vscode.window.showInputBox({ prompt: 'Enter your Git Commit message' }).then(commitMessage => {
            if (commitMessage) {
                const terminal = vscode.window.createTerminal("Git Commit");
                terminal.show();
                terminal.sendText("git add .");
                terminal.sendText(`git commit -m \"${commitMessage}\"`);
                terminal.sendText("git push --set-upstream origin $(git branch --show-current)");
            }
        });
    });

    context.subscriptions.push(openGitCommitPanelCommand);
}

class GitCommitViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(): vscode.TreeItem[] {
        const commitButton = new vscode.TreeItem("📌 Commit Wochenbericht", vscode.TreeItemCollapsibleState.None);
        commitButton.command = {
            command: "extension.openGitCommitPanel",
            title: "Open Git Commit Panel"
        };
        commitButton.iconPath = new vscode.ThemeIcon('git-commit');

        return [commitButton];
    }
}

export function deactivate() {}