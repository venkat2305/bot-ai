import { Button, Input } from "antd"

function InputBar({ inputText, setInputText, onAsk, onSave }) {

    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
            <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 6 }}
                onPressEnter={(e) => {
                    if (e.shiftKey) return
                    e.preventDefault()
                    if (inputText !== "") {
                        onAsk(inputText)
                        setInputText("")
                    }
                }}
                style={{ flexGrow: 1, marginRight: "10px" }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
            <Button onClick={() => {
                if (inputText !== "") {
                    onAsk(inputText)
                    setInputText("")
                }
            }} type="primary" style={{ marginRight: "10px", color: "black" }}>Ask</Button>
            <Button onClick={onSave} style={{ color: "black" }} type="primary">Save</Button>
        </div>
    )
}

export default InputBar