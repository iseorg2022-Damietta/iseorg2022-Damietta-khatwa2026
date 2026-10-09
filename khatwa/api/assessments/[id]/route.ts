  const updated = await db.assessment.update({ where: { id: assessmentId },
    data: { reviewedBy: s.uid, reviewedAt: new Date(),
            adjustedLevel: level !== a.level ? level : null, reviewNote: reason || null } });