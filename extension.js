const vscode = require('vscode');

function activate(context) {
    console.log('ColorizedTODO 插件已激活');
    
    // 创建装饰类型
    const todoDecorationType = vscode.window.createTextEditorDecorationType({
        color: '#9370DB', // 低饱和度紫色
        fontWeight: 'bold'
    });

    // 获取配置
    function getConfig() {
        return vscode.workspace.getConfiguration('colorizedTodo');
    }

    // 更新装饰
    function updateDecorations(editor) {
        if (!editor) return;
        
        const config = getConfig();
        if (!config.get('enabled')) {
            editor.setDecorations(todoDecorationType, []);
            return;
        }

        const text = editor.document.getText();
        const decorations = [];
        
        // 匹配TODO的正则表达式
        const todoRegex = /TODO/gi;
        
        // 获取所有注释的范围
        const commentRanges = [];
        for (let i = 0; i < editor.document.lineCount; i++) {
            const line = editor.document.lineAt(i);
            const commentIndex = line.text.indexOf('//');
            if (commentIndex !== -1) {
                const commentRange = new vscode.Range(
                    i, commentIndex,
                    i, line.text.length
                );
                commentRanges.push(commentRange);
            }
        }

        // 在注释中查找 TODO，并高亮整段包含 TODO 的注释
        commentRanges.forEach(range => {
            const commentText = editor.document.getText(range);
            
            // 如果该注释中包含 TODO，则整段注释都应用装饰
            if (todoRegex.test(commentText)) {
                decorations.push({
                    range,
                    hoverMessage: 'TODO 待办事项'
                });
            }
            
            // 重置正则的 lastIndex，避免全局匹配带来的状态问题
            todoRegex.lastIndex = 0;
        });

        editor.setDecorations(todoDecorationType, decorations);
    }

    // 注册文本编辑器监听器
    const disposable = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    });

    // 注册文档内容变化监听器
    const changeDisposables = [
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateDecorations(editor);
            }
        }),
        
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('colorizedTodo')) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    updateDecorations(editor);
                }
            }
        })
    ];

    // 初始化当前活动编辑器
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor);
    }

    context.subscriptions.push(
        disposable,
        ...changeDisposables,
        todoDecorationType
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};