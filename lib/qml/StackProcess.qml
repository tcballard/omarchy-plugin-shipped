import QtQuick
import Quickshell.Io

Item {
    id: root
    property var command: []
    property int timeoutMs: 45000
    property int maximumBytes: 2097152
    property string lastError: ""
    property int received: 0
    property bool receivedObject: false
    readonly property bool running: child.running
    signal result(var value)
    signal finished()
    function start(args) {
        if (child.running) return false
        command = args; lastError = ""; received = 0; receivedObject = false
        child.running = true; deadline.restart(); return true
    }
    function stop() { deadline.stop(); if (child.running) child.signal(15) }
    Component.onDestruction: stop()
    Process {
        id: child
        command: root.command
        stdout: SplitParser {
            onRead: data => {
                root.received += data.length
                if (root.received > root.maximumBytes) { root.lastError = "Response limit exceeded"; root.stop(); return }
                try { const value = JSON.parse(data); root.receivedObject = true; root.result(value) }
                catch (e) { root.lastError = "Invalid JSON response" }
            }
        }
        stderr: SplitParser { onRead: data => { root.lastError = data.slice(0, 300) } }
        onExited: (code, status) => {
            deadline.stop()
            if (code !== 0 && !root.lastError) root.lastError = "Helper exited " + code
            if (!root.receivedObject && !root.lastError) root.lastError = "Helper returned no result"
            root.finished()
        }
    }
    Timer { id: deadline; interval: root.timeoutMs; onTriggered: { root.lastError = "Request timed out"; child.signal(15) } }
}
