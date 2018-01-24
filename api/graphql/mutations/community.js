import CommunityService from '../../services/CommunityService'
import convertGraphqlData from './convertGraphqlData'

export function updateCommunity (userId, communityId, changes) {
  return Membership.hasModeratorRole(userId, communityId)
  .then(isModerator => {
    if (isModerator) {
      return Community.find(communityId)
      .then(community => community.update(convertGraphqlData(changes)))
    } else {
      throw new Error("You don't have permission to modify this community")
    }
  })
}

export function addModerator (userId, personId, communityId) {
  return Membership.hasModeratorRole(userId, communityId)
  .then(isModerator => {
    if (isModerator) {
      return Membership.setModeratorRole(personId, communityId)
      .then(() => Community.find(communityId))
    } else {
      throw new Error("You don't have permission to modify this community")
    }
  })
}

export function removeModerator (userId, personId, communityId) {
  return Membership.hasModeratorRole(userId, communityId)
  .then(isModerator => {
    if (isModerator) {
      return Membership.removeModeratorRole(personId, communityId)
      .then(() => Community.find(communityId))
    } else {
      throw new Error("You don't have permission to modify this community")
    }
  })
}

// Admin-only (for now) addition of member
export async function addMember (authZ, personId, communityId) {
  if (!authZ.isAdmin) throw new Error("You don't have permission to modify this community")
  await Membership.create(personId, communityId)
  return Membership.find(personId, communityId)
}

/**
 * As a moderator, removes member from a community.
 */
export function removeMember (loggedInUser, userToRemove, communityId) {
  return Membership.hasModeratorRole(loggedInUser, communityId)
    .then(isModerator => {
      if (isModerator) {
        return CommunityService.removeMember(userToRemove, communityId, loggedInUser)
          .then(() => Community.find(communityId))
      } else {
        throw new Error("You don't have permission to moderate this community")
      }
    })
}

export function regenerateAccessCode (userId, communityId) {
  return Membership.hasModeratorRole(userId, communityId)
  .then(ok => {
    if (!ok) {
      throw new Error("You don't have permission to modify this community")
    }
  })
  .then(() => Community.find(communityId))
  .then(community => {
    if (!community) throw new Error('Community not found')
    return Community.getNewAccessCode()
    .then(code => community.save({beta_access_code: code}, {patch: true})) // eslint-disable-line camelcase
  })
}

export async function createCommunity (userId, data) {
  if (data.networkId) {
    const canModerate = await NetworkMembership.hasModeratorRole(userId, data.networkId)
    if (!canModerate) {
      throw new Error("You don't have permission to add a community to this network")
    }
  }
  return Community.create(userId, convertGraphqlData(data))
  .then(({ community, membership }) => {
    return membership
  })
}
