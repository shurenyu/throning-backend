const isUserInRelationship = relationshipStatus => {
  const inRelationshipStatuses = ['In a Relationship', 'Married'];

  if (relationshipStatus === 'Private' || relationshipStatus === null) {
    return null;
  }

  if (inRelationshipStatuses.indexOf(relationshipStatus) !== -1) {
    return true;
  }
  return false;
};

module.exports = { isUserInRelationship };
