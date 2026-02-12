export function followStatusResponse(args: { followersCount: number; isAuthenticated: boolean; hasFollow: boolean }) {
  return {
    isFollowing: args.isAuthenticated ? args.hasFollow : false,
    followersCount: args.followersCount,
  };
}
