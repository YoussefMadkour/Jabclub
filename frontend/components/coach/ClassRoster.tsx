  const classDate = new Date(classInfo.startTime);
  const isToday = classDate.toDateString() === new Date().toDateString();
  const now = new Date();
  const classEnded = new Date(classInfo.endTime) < now;
  const classEnded = new Date(classInfo.endTime) < now;
