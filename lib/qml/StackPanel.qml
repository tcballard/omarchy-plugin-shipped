import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import qs.Commons
import qs.Ui

Item {
    id: root
    property var bar: null
    property var settings: ({})
    property var anchorItem: null
    property var hostWidget: null
    property var service: null
    property string title: ""
    property string hints: "Enter open · Esc close"
    property bool opened: false
    property var rows: service && service.snapshot ? service.snapshot.rows || [] : []
    property var filteredRows: rows.filter(r => (r.title + " " + r.detail).toLowerCase().indexOf(search.text.toLowerCase()) >= 0)
    property var selected: list.currentIndex >= 0 && list.currentIndex < filteredRows.length ? filteredRows[list.currentIndex] : null
    property string drilldown: ""
    signal action(string id, string key)
    function open(payloadJson) { opened = true; search.text = ""; list.currentIndex = 0; drilldown = "" }
    function close() { opened = false; drilldown = "" }
    function invoke(key) { if (selected) action(String(selected.id), key) }
    function keyAction(event) {
        if (event.key === Qt.Key_Escape) { if (drilldown) drilldown = ""; else close(); event.accepted = true }
        else if (event.key === Qt.Key_J || event.key === Qt.Key_Down) { list.currentIndex = Math.min(filteredRows.length - 1, list.currentIndex + 1); event.accepted = true }
        else if (event.key === Qt.Key_K || event.key === Qt.Key_Up) { list.currentIndex = Math.max(0, list.currentIndex - 1); event.accepted = true }
        else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) { invoke("enter"); event.accepted = true }
        else if (event.key === Qt.Key_Slash) { search.forceActiveFocus(); event.accepted = true }
        else if (event.key === Qt.Key_Space) { invoke("space"); event.accepted = true }
        else if (event.text) { invoke(event.text); event.accepted = true }
    }
    KeyboardPanel {
        id: popup
        anchorItem: root.anchorItem
        bar: root.bar
        owner: root
        open: root.opened
        focusTarget: body
        contentWidth: Math.max(280, Math.min(680, availableCardWidth - 32))
        contentHeight: Math.max(220, Math.min(540, availableCardHeight - 32))
        ColumnLayout {
            id: body
            anchors.fill: parent
            spacing: 12
            focus: true
            Keys.onPressed: event => root.keyAction(event)
            Text { text: root.title; color: Color.popups.text; font.family: Style.font.family; font.pixelSize: 22; font.bold: true }
            Text { text: root.service ? root.service.message || root.service.snapshot.summary || "Loading…" : "Service unavailable"; color: Color.popups.text; Layout.fillWidth: true; wrapMode: Text.Wrap; font.pixelSize: 12 }
            TextField {
                id: search
                Layout.fillWidth: true
                placeholderText: "Search /"
                placeholderTextColor: Color.muted
                color: Color.popups.text
                background: Rectangle { color: "transparent"; border.color: Color.popups.border }
                onTextChanged: list.currentIndex = 0
                Keys.onPressed: event => { if (event.key === Qt.Key_Escape || event.key === Qt.Key_Down || event.key === Qt.Key_Return) { body.forceActiveFocus(); if (event.key !== Qt.Key_Escape) root.keyAction(event); event.accepted = true } }
            }
            ListView {
                id: list
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                model: root.filteredRows
                visible: !root.drilldown
                currentIndex: 0
                spacing: 3
                section.property: "group"
                section.delegate: Text { required property string section; text: section; color: Color.popups.text; font.bold: true; height: section ? 28 : 0 }
                boundsBehavior: Flickable.StopAtBounds
                delegate: Rectangle {
                    required property var modelData
                    required property int index
                    width: list.width
                    height: 62
                    color: index === list.currentIndex ? Color.popups.border : "transparent"
                    RowLayout {
                        anchors.fill: parent; anchors.margins: 8; spacing: 10
                        Text { text: modelData.reliability === "observed" ? "●" : modelData.reliability === "declared" ? "○" : "◐"; color: Color.popups.text }
                        ColumnLayout {
                            Layout.fillWidth: true; spacing: 4
                            Text { text: modelData.title; color: Color.popups.text; elide: Text.ElideRight; Layout.fillWidth: true; font.bold: true }
                            Text { text: modelData.detail; color: Color.popups.text; elide: Text.ElideRight; Layout.fillWidth: true; font.pixelSize: 11 }
                        }
                    }
                    MouseArea { anchors.fill: parent; onClicked: { list.currentIndex = index; body.forceActiveFocus() } onDoubleClicked: root.invoke("enter") }
                }
                Text { anchors.centerIn: parent; visible: !list.count; text: "No matching items"; color: Color.popups.text }
            }
            ScrollView {
                Layout.fillWidth: true; Layout.fillHeight: true; visible: !!root.drilldown
                TextArea { text: root.drilldown; readOnly: true; wrapMode: TextEdit.Wrap; color: Color.popups.text; background: null; selectByMouse: true }
            }
            Text { text: root.hints; color: Color.popups.text; font.pixelSize: 11; wrapMode: Text.Wrap; Layout.fillWidth: true }
            Text { text: "● observed   ◐ inferred   ○ source reference"; color: Color.popups.text; font.pixelSize: 10 }
        }
    }
}
