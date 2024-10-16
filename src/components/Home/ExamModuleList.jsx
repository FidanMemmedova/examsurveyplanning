import React, { useEffect, useState } from "react";
import { Table, Input, Checkbox, message } from "antd";
import "./style.scss";

const ExamModuleList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://dev-studioapi.code.az/api/Workers/GetAllExamModule"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        const flattenedData = flattenModules(result);
        setData(flattenedData);

        const filtered = flattenedData.filter(
          (item) => new Date(item.endDate) > new Date("2024-10-01")
        );
        setFilteredData(filtered);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const flattenModules = (data) => {
    return data.flatMap((classData) =>
      classData.modules.map((module) => ({
        classId: classData.classId,
        moduleId: module.moduleId,
        className: classData.className,
        programName: classData.programName,
        moduleName: module.modulName,
        startDate: module.startDate,
        endDate: module.endDate,
        survey: module.isSurvey || false,
        exam: module.isExam || false,
      }))
    );
  };

  const getUniqueData = (data) => {
    const uniqueMap = new Map();
    data.forEach((item) => {
      const key = `${item.className}-${item.programName}-${item.moduleName}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });
    return Array.from(uniqueMap.values());
  };

  const postExamData = async (moduleId, classId, examValue) => {
    try {
      const response = await fetch(
        "https://dev-studioapi.code.az/api/Workers/CreateExamSheet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ moduleId, classId, isExam: examValue }]),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post exam data to API");
      }

      message.success("Exam data successfully posted");
    } catch (error) {
      message.error("Failed to post exam data");
    }
  };

  const postSurveyData = async (moduleId, classId, surveyValue) => {
    try {
      const response = await fetch(
        "https://dev-studioapi.code.az/api/Workers/CreateSurveySheet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ moduleId, classId, isSurvey: surveyValue }]),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post survey data to API");
      }

      message.success("Survey data successfully posted");
    } catch (error) {
      message.error("Failed to post survey data");
    }
  };

  const handleCheckboxChange = (record, key) => {
    const updatedData = filteredData.map((item) =>
      item.classId === record.classId && item.moduleId === record.moduleId
        ? {
            ...item,
            [key]: !record[key],
          }
        : item
    );

    setFilteredData(updatedData);

    if (key === "exam") {
      postExamData(
        record.moduleId,
        record.classId,
        updatedData.find(
          (item) =>
            item.classId === record.classId && item.moduleId === record.moduleId
        ).exam
      );
    }

    if (key === "survey") {
      postSurveyData(record.moduleId, record.classId, !record.survey);
    }
  };

  const handleSearch = (selectedKeys, confirm) => {
    confirm();
    setSearchText(selectedKeys[0]);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const uniqueFilteredData = getUniqueData(
    filteredData.filter((item) =>
      item.className.toLowerCase().includes(searchText.toLowerCase())
    )
  );
  const uniqueProgramNames = [...new Set(data.map((item) => item.programName))];

  const columns = [
    {
      title: "Group Name",
      dataIndex: "className",
      key: "className",
      width: 200,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => handleSearch(selectedKeys, confirm)}
            style={{ marginBottom: 8, display: "block" }}
          />
          <button
            className="search-button"
            onClick={() => handleSearch(selectedKeys, confirm)}
          >
            Search
          </button>
          <button
            className="reset-button"
            onClick={() => {
              clearFilters();
              setSearchText("");
            }}
            style={{
              marginLeft: 8,
              backgroundColor: "#f5222d",
              color: "white",
              borderRadius: "4px",
              padding: "4px 8px",
              border: "none",
            }}
          >
            Reset
          </button>
        </div>
      ),
      filterIcon: (filtered) => <span>{filtered ? "🔍" : "🔍"}</span>,
      onFilter: (value, record) =>
        record.className.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: "Program Name",
      dataIndex: "programName",
      key: "programName",
      width: 200,
      filters: uniqueProgramNames.map((name) => ({
        text: name,
        value: name,
      })),
      filterMultiple: true,
      onFilter: (value, record) => record.programName === value,
    },
    {
      title: "Module Name",
      dataIndex: "moduleName",
      key: "moduleName",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 100,
      render: (text) => new Date(text).toLocaleDateString(),
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 100,
      render: (text) => new Date(text).toLocaleDateString(),
      sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
    },
    {
      title: "Survey",
      dataIndex: "survey",
      key: "survey",
      filters: [
        { text: "True", value: true },
        { text: "False", value: false },
      ],
      filterMultiple: false,
      defaultFilteredValue: [false],
      onFilter: (value, record) => record.survey === value,
      render: (text, record) => {
        if (record.programName === "Proqramlaşdırma") {
          return null;
        }
        return (
          <Checkbox
            checked={record.survey}
            onChange={() => handleCheckboxChange(record, "survey")}
            style={{ fontSize: "16px", lineHeight: "24px" }}
          />
        );
      },
    },
    {
      title: "Exam",
      dataIndex: "exam",
      key: "exam",
      filters: [
        { text: "True", value: true },
        { text: "False", value: false },
      ],
      onFilter: (value, record) => record.exam === value,
      render: (text, record) => {
        const isProgramming =
          record.programName === "Programming Backend" ||
          record.programName === "Programming Frontend";

        return isProgramming ? (
          <Checkbox
            checked={record.exam}
            onChange={() => handleCheckboxChange(record, "exam")}
            style={{ fontSize: "16px", lineHeight: "24px" }}
          />
        ) : null;
      },
    },
  ];

  return (
    <div style={{ width: "80vw" }}>
      <Table
        dataSource={uniqueFilteredData}
        columns={columns}
        rowKey={(record) => `${record.className}-${record.moduleName}`}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default ExamModuleList;
