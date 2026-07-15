import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/userService";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    codeforcesHandle: "",
    leetcodeUsername: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        codeforcesHandle: data.user.codeforcesHandle || "",
        leetcodeUsername: data.user.leetcodeUsername || "",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateProfile({
        name: form.name,
        codeforcesHandle: form.codeforcesHandle,
        leetcodeUsername: form.leetcodeUsername,
      });

      alert("Profile Updated Successfully");
    } catch (error) {
      console.log(error);
      alert("Update Failed");
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
      <h1>Profile</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
        />

        <input
          name="email"
          value={form.email}
          readOnly
        />

        <input
          name="codeforcesHandle"
          value={form.codeforcesHandle}
          onChange={handleChange}
          placeholder="Codeforces Handle"
        />

        <input
          name="leetcodeUsername"
          value={form.leetcodeUsername}
          onChange={handleChange}
          placeholder="LeetCode Username"
        />

        <button type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default Profile;