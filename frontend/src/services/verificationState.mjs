export function isVerifiedFixedFromLatest(verifications) {
  const latest = verifications.reduce(
    (current, candidate) => (!current || candidate.id > current.id ? candidate : current),
    null,
  );
  return latest?.verification_result === 'Verified Fixed';
}

export function applyRefreshedVerificationState(findings, refreshedFinding) {
  return findings.map((finding) =>
    finding.id === refreshedFinding.id
      ? { ...finding, is_verified_fixed: refreshedFinding.is_verified_fixed === true }
      : finding,
  );
}
