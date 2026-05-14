import profileDoctor from "../../../assets/login_doctor_profile.png";

export const adminUsers = [
    {
        id: "SKN-2041",
        name: "Dr. Elena Aris",
        role: "Doctor",
        gender: "Female",
        email: "elenaaris@icloud.com",
        phone: "+628134567890",
        birthDate: "April 23, 1996",
        status: "Active",
        avatar: profileDoctor,
    },
    {
        id: "SKN-2041",
        name: "Sarah Johnson",
        role: "Patient",
        gender: "Female",
        email: "sarahjohnson@icloud.com",
        phone: "+628134567891",
        birthDate: "May 18, 1998",
        status: "Active",
        avatar: profileDoctor,
    },
    {
        id: "SKN-2041",
        name: "Minaj Kim",
        role: "Patient",
        gender: "Male",
        email: "minajkim@icloud.com",
        phone: "+628134567892",
        birthDate: "March 15, 1995",
        status: "Active",
    },
    ...Array.from({ length: 5 }, (_, index) => ({
        id: "SKN-2041",
        name: "Niki As",
        role: "Doctor",
        gender: "Male",
        email: "nikias@icloud.com",
        phone: "+628134567890",
        birthDate: "April 23, 1996",
        status: "Pending",
        key: index,
    })),
];

export const adminDoctors = [
    {
        id: "SKN-2041",
        name: "Dr. Elena Aris",
        registrationDate: "JAN 12, 2024",
        email: "elenaaris@icloud.com",
        patientLoad: 1,
        avatar: profileDoctor,
    },
    {
        id: "SKN-2041",
        name: "Dr. Elena Aris",
        registrationDate: "JAN 12, 2024",
        email: "elenaaris@icloud.com",
        patientLoad: 1,
        avatar: profileDoctor,
    },
];

export const verificationRequests = [
    {
        id: "SKN-2041",
        patientName: "Sarah Johnson",
        date: "JAN 12, 2024",
        diagnosis: "60% Malignant Melanoma",
        avatar: profileDoctor,
    },
];
