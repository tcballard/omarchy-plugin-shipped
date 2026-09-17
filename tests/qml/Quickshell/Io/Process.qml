import QtQuick
Item {
    property var command: []
    property bool running: false
    property QtObject stdout: null
    property QtObject stderr: null
    signal exited(int code, int status)
    function signal(number) { running = false; exited(number, 0) }
}
