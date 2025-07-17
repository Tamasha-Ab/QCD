import { useState } from "react";
import api from "../api/api";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const AddProject = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    team: "",
    priority: "",
    note: "",
    files: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, files: Array.from(e.target.files) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("startDate", formData.startDate);
    data.append("endDate", formData.endDate);
    data.append("team", formData.team);
    data.append("priority", formData.priority);
    data.append("note", formData.note);
    formData.files.forEach((file) => data.append("files", file));

    try {
      const response = await api.post("/inspections", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Project submitted successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting project");
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 py-6 font-sans flex flex-col">
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="flex-1 space-y-6 bg-gray-50 p-6 rounded-md">
          <div>
            <h2 className="text-2xl font-bold">Project Details</h2>
            <label className="block mt-4 font-semibold">Project Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter project name"
              className="w-full p-2 border rounded-md bg-white mt-1"
            />

            <label className="block mt-4 font-semibold">Project Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly describe the project objectives and scopes"
              className="w-full p-2 border rounded-md bg-white mt-1"
              rows={4}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold mt-6 mb-2">Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-white mt-1"
                />
              </div>
              <div>
                <label className="block font-semibold">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-white mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mt-6 mb-2">Team & Priority</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold">Team Assignment</label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-white mt-1"
                >
                  <option value="">Select team</option>
                  <option value="Alpha">Alpha</option>
                  <option value="Beta">Beta</option>
                  <option value="Gamma">Gamma</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold">Priority Level</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md bg-white mt-1"
                >
                  <option value="">Priority level</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700"
            >
              Submit

            </button>
          </div>
        </form>

        <div className="w-full lg:w-80 space-y-6">
          <div>
            <h2 className="text-xl font-bold">Attachments</h2>
            <label className="block mt-2">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              <div className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md font-medium">
                📎 Upload files
              </div>
            </label>
            <ul className="mt-2 space-y-2 text-sm">
              {formData.files.map((file, i) => (
                <li key={i} className="bg-gray-100 px-3 py-2 rounded-md">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" /> Note
            </h2>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add project note"
              className="w-full p-2 border rounded-md bg-white mt-2"
              rows={4}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold">Initial tasks</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <input type="checkbox" /> Define project scope
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" /> Gather requirements
              </li>
              <li className="flex items-center gap-2">
                <input type="checkbox" /> Create a mockup
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProject;
