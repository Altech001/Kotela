
export const getYears = (end = new Date().getFullYear() - 18, start = 1920) => {
    const years = [];
    for (let i = end; i >= start; i--) {
        years.push(i.toString());
    }
    return years;
};

export const getMonths = () => {
    return [
        { value: "01", label: "January" },
        { value: "02", label: "February" },
        { value: "03", label: "March" },
        { value: "04", label: "April" },
        { value: "05", label: "May" },
        { value: "06", label: "June" },
        { value: "07", label: "July" },
        { value: "08", label: "August" },
        { value: "09", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];
};

export const getDaysInMonth = (year: number | null, month: number | null) => {
    if (year === null || month === null) return [];
    const date = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) {
        days.push(i.toString().padStart(2, '0'));
    }
    return days;
};
