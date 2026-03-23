function AttendancePanel({ students, attendanceMap }) {
  if (!students.length) {
    return <p>No students added yet.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const entry = attendanceMap.get(student.id);
            return (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.rollNo}</td>
                <td>{entry ? "Present" : "Absent"}</td>
                <td>{entry?.time ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AttendancePanel;
