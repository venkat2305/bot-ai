import { Button, Input } from "antd"
import { useEffect } from "react"

function InputBar({ inputText, setInputText, onAsk, onSave }) {

    return (
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <Input onPressEnter={onAsk} style={{ flexGrow: 1, marginRight: "10px" }} value={inputText} onChange={(e) => setInputText(e.target.value)} />
            <Button onClick={onAsk} type="primary" style={{ marginRight: "10px", color: "black" }}>Ask</Button>
            <Button onClick={onSave} style={{ color: "black" }} type="primary">Save</Button>
        </div>
    )
}

export default InputBar