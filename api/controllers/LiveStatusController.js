import { fetchAndPresentFollowed } from '../services/TagPresenter'
import { get } from 'lodash/fp'

module.exports = {
  show: function (req, res) {
    if (!req.session.userId) return res.ok({})
    const communityId = req.param('communityId')

    return Promise.join(
      User.find(req.session.userId, {withRelated: ['memberships']}),
      communityId && Community.find(communityId),
      (user, com) =>
        fetchAndPresentFollowed(get('id', com), user.id)
        .then(left_nav_tags => res.ok({
          new_notification_count: user.get('new_notification_count'),
          left_nav_tags,
          memberships: user.relations.memberships.map(m => ({
            id: m.id,
            new_notification_count: m.get('new_notification_count')
          }))
        })))
  }
}
