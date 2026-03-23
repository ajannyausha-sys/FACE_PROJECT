import { useState } from "react";

function RegisterStudentForm({ onAddStudent }) {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoll = rollNo.trim();
    if (!trimmedName || !trimmedRoll) return;

    const result = onAddStudent({
      id: crypto.randomUUID(),
      name: trimmedName,
      rollNo: trimmedRoll
    });

    setMessage(result.message);
    if (!result.ok) return;

    setName("");
    setRollNo("");
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        type="text"
        placeholder="Student name"
      />
      <input
        value={rollNo}
        onChange={(event) => setRollNo(event.target.value)}
        type="text"
        placeholder="Roll number (e.g. S001)"
      />
      <button type="submit">Add Student</button>
      {message && <small>{message}</small>}
    </form>
  );
}

export default RegisterStudentForm;
