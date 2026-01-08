import React from 'react';

const IDCardTemplate = React.forwardRef(({ student, batchSubject }, ref) => {
    if (!student) return null;

    const studentPhoto = student.studentId?.photo || student.photo;
    const studentName = student.studentId?.fullName || student.studentName;
    const studentIdStr = student.studentId?.studentId || student.studentId || '-';

    return (
        <div
            ref={ref}
            data-id-template
            className="id-card-container"
            style={{
                width: '350px',
                height: '550px',
                position: 'relative',
                backgroundColor: 'white',
                overflow: 'hidden'
            }}
        >
            {/* Background Image - The original template */}
            <img
                src="/images/cc_id_temp.png"
                alt="ID Card Template"
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'fill', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />

            {/* Profile Photo - Precisely positioned in the circle area */}
            <div className="profile-photo-container" style={{
                position: 'absolute',
                top: '125px',
                left: '70px',
                width: '210px',
                height: '210px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                border: '1px solid #f3f4f6'
            }}>
                {studentPhoto ? (
                    <img
                        src={studentPhoto}
                        alt={studentName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                    />
                ) : (
                    <div style={{ color: '#e5e7eb' }}>
                        <svg style={{ width: '96px', height: '96px' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Student Info Overlay */}
            <div className="info-overlay" style={{
                position: 'absolute',
                top: '365px',
                left: '35px',
                right: '35px',
                textAlign: 'center',
                fontFamily: 'sans-serif'
            }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#1e2952',
                    margin: '0 0 4px 0',
                    lineHeight: '1.2'
                }}>
                    {studentName}
                </h2>
                <p style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: 'black',
                    textTransform: 'uppercase',
                    margin: '0 0 4px 0'
                }}>
                    {student.studentId?.courseName || student.courseName || batchSubject || ""}
                </p>
                <p style={{
                    fontSize: '14px',
                    margin: 0,
                    color: '#1e2952'
                }}>
                    ID: {studentIdStr}
                </p>
            </div>
        </div>
    );
});

export default IDCardTemplate;
