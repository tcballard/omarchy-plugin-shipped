import QtQuick
Item {
    property var bar: null
    property string text: ""
    property string tooltipText: ""
    property color foreground: "white"
    implicitWidth: label.implicitWidth + 20
    implicitHeight: 32
    signal pressed(int mouseButton)
    Text { id: label; anchors.centerIn: parent; text: parent.text; color: parent.foreground }
}
