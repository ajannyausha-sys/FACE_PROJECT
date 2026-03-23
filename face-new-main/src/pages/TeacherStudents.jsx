import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAppState } from "../context/AppStateContext";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { Users, Mail, UserCircle, Search, RefreshCw, AlertCircle } from "lucide-react";

export default function TeacherStudents() {
  const { isFirebaseConfigured } = useAppState();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      if (!isFirebaseConfigured || !db) {
        if (active) {
          setRows([]);
          setError("Firebase is not configured.");
          setLoading(false);
        }
        return;
      }

      try {
        setError("");
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const snapshot = await getDocs(q);
        const nextRows = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            email: data.email ?? "",
            name: data.name || `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
          };
        });

        if (active) setRows(nextRows);
      } catch (err) {
        if (active) {
          setRows([]);
          if (err?.code === "permission-denied") {
            setError("Permission denied by Firestore rules. Allow teachers to read student profiles.");
          } else {
            setError("Failed to load students.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStudents();
    return () => {
      active = false;
    };
  }, [isFirebaseConfigured]);

  const filteredRows = rows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
           <div className="p-3 rounded-2xl bg-primary/20 text-primary shadow-glow-primary">
             <Users className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold tracking-tight">Student Directory</h2>
             <p className="text-xs text-textSecondary font-bold uppercase tracking-widest mt-1">Authorized Profile Access</p>
           </div>
        </div>

        <div className="relative group">
           <Search className="w-4 h-4 text-textSecondary absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
           <input 
             type="text" 
             placeholder="Search by name or email..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-primary/50 transition-all min-w-[320px]"
           />
        </div>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        {loading ? (
          <div className="p-24 text-center space-y-4">
             <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary opacity-50" />
             <p className="text-sm font-bold tracking-widest text-textSecondary uppercase">Accessing Database...</p>
          </div>
        ) : error ? (
          <div className="p-24 text-center space-y-4">
             <AlertCircle className="w-12 h-12 mx-auto text-danger opacity-50" />
             <p className="text-sm font-bold text-danger">{error}</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-24 text-center space-y-4 opacity-30">
             <Users className="w-16 h-16 mx-auto" />
             <p className="text-sm font-medium">No student records found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Full Name</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-textSecondary uppercase tracking-widest">Electronic Mail</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-textSecondary uppercase tracking-widest">System UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRows.map((student, idx) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-textSecondary group-hover:text-primary transition-colors border border-white/10">
                          <UserCircle className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold group-hover:text-primary transition-colors">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-textSecondary group-hover:text-textPrimary transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{student.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-[10px] bg-white/5 px-2 py-1 rounded font-mono text-primary/70">
                        {student.id}
                      </code>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>
    </div>
  );
}
