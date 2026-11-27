import { useCallback } from "react";
import { groupService } from "../services/group";

export default function useGroup() {
  const createGroup = useCallback((name, usernames) => groupService.create(name, usernames), []);
  const getDetails = useCallback((groupId) => groupService.details(groupId), []);
  const getMembers = useCallback((groupId) => groupService.members(groupId), []);
  return { createGroup, getDetails, getMembers };
}
