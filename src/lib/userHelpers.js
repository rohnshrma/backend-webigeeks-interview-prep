export function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    course: user.course,
    approved: user.approved,
    createdAt: user.createdAt,
  };
}

export function createDefaultProgress() {
  return {
    savedQuestions: [],
    importantQuestions: [],
    completedTopics: [],
    topicActions: {},   // { [topicId]: { started, important, correct, issue } }
    questionActions: {}, // { [questionId]: { correct, doubtful, starred } }
  };
}
