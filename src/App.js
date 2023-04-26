import React, { useState, useEffect } from 'react';

export default function App() {
  // State for WebSocket address input
  const [webSocketAddress, setWebSocketAddress] = useState('ws://10.11.8.204:3000/rpc');

  // State for WebSocket connection
  const [webSocket, setWebSocket] = useState(null);

  // State for description input
  const [description, setDescription] = useState('');

  // State for seed subject line input
  const [seedSubjectLine, setSeedSubjectLine] = useState('');

  // State for generated subject lines
  const [generatedSubjectLines, setGeneratedSubjectLines] = useState([]);

  // State for approved subject lines
  const [approvedSubjectLines, setApprovedSubjectLines] = useState(new Set());

  // State for edited subject lines
  const [editedSubjectLines, setEditedSubjectLines] = useState(new Map());
  const [editingIndex, setEditingIndex] = useState(null);

  // State for rejection comments
  const [setRejectionComments] = useState(new Map());

  // Initialize WebSocket connection and set up event handlers
  useEffect(() => {
    if (webSocket) {
      webSocket.onopen = () => {
        console.log('WebSocket connection opened.');
      };

      webSocket.onclose = () => {
        console.log('WebSocket connection closed.');
      };

      webSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setGeneratedSubjectLines(data.result);
        // debugger;
        // if (Array.isArray(data.result) && data.subjectLines.length > 0) {
        //   setGeneratedSubjectLines(data.subjectLines);
        // } else if (data.action === 'replace' && data.index !== undefined) {
        //   setGeneratedSubjectLines((prevSubjectLines) => {
        //     const newSubjectLines = [...prevSubjectLines];
        //     newSubjectLines[data.index] = data.subjectLine;
        //     return newSubjectLines;
        //   });
        // }
      };

      return () => {
        webSocket.close();
      };
    }
  }, [webSocket]);

  const connectWebSocket = () => {
    if (webSocketAddress) {
      setWebSocket(new WebSocket(webSocketAddress));
    }
  };

  const sendWebSocketMessage = () => {
    if (webSocket && description && seedSubjectLine) {
      const message = {
        jsonrpc: "2.0",
        id: 1,
        method: "prompt",
        params: [seedSubjectLine],
      };
      webSocket.send(JSON.stringify(message));
    }
  };

  const approveSubjectLine = (index) => {
    setApprovedSubjectLines((prevApprovedSubjectLines) => {
      const newApprovedSubjectLines = new Set(prevApprovedSubjectLines);
      if (newApprovedSubjectLines.has(index)) {
        newApprovedSubjectLines.delete(index);
      } else {
        newApprovedSubjectLines.add(index);
      }
      return newApprovedSubjectLines;
    });
  };

  const startEditingSubjectLine = (index) => {
    if (!approvedSubjectLines.has(index)) {
      setEditingIndex(index);
    }
  };

  const saveEditedSubjectLine = (index) => {
    const updatedSubjectLine = document.getElementById(`edit-${index}`).value;
    setEditedSubjectLines((prevEditedSubjectLines) => {
      const newEditedSubjectLines = new Map(prevEditedSubjectLines);
      newEditedSubjectLines.set(index, updatedSubjectLine);
      return newEditedSubjectLines;
    });
    setEditingIndex(null);
  };

  const rejectSubjectLine = (index) => {
    const rejectionReason = document.getElementById(`rejection-${index}`).value;
    if (rejectionReason) {
      setRejectionComments((prevRejectionComments) => {
        const newRejectionComments = new Map(prevRejectionComments);
        newRejectionComments.set(index, rejectionReason);
        return newRejectionComments;
      });

      const message = {
        action: 'reject',
        index: index,
        rejectionReason: rejectionReason,
      };
      webSocket.send(JSON.stringify(message));
    }
  };

  return (
    <div>
      <h1>WebSocket Subject Line Tester</h1>
      <input
        type="text"
        placeholder="WebSocket Address"
        value={webSocketAddress}
        onChange={(e) => setWebSocketAddress(e.target.value)}
      />
      <button onClick={connectWebSocket}>Connect</button>
      <br />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <br />
      <input
        type="text"
        placeholder="Seed Subject Line"
        value={seedSubjectLine}
        onChange={(e) => setSeedSubjectLine(e.target.value)}
      />
      <button onClick={sendWebSocketMessage}>Send</button>
      <ul>
        {generatedSubjectLines.map((subjectLine, index) => (
          <li key={index}>
            {editingIndex === index ? (
              <input id={`edit-${index}`} defaultValue={subjectLine} />
            ) : (
              <span>{editedSubjectLines.get(index) || subjectLine}</span>
            )}
            <br />
            <button onClick={() => approveSubjectLine(index)}>
              {approvedSubjectLines.has(index) ? "Unapprove" : "Approve"}
            </button>
            {editingIndex === index ? (
              <button onClick={() => saveEditedSubjectLine(index)}>Save</button>
            ) : (
              <button onClick={() => startEditingSubjectLine(index)}>Edit</button>
            )}
            <br />
            <input
              type="text"
              id={`rejection-${index}`}
              placeholder="Rejection Reason"
            />
            <button onClick={() => rejectSubjectLine(index)}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
