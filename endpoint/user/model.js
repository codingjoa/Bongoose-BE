const Model = require('../model');
class UserModel extends Model {
  constructor(req) {
    super(req);

    this.start = (req.query?.start ?? 0) - 0;
    this.end = (req.query?.end ?? 15) - 0;
    this.keyword = req.query?.keyword ?? '';
    this.mysubscribe = req.query?.mysubscribe ?? false;
  }

  async read(res) {
    const fetchOptions = (this.mysubscribe) ? [ this.requestUserID, `%${this.keyword}%`, this.start, this.end ] : [ `%${this.keyword}%`, this.start, this.end ];
    const fetchMetadata = (this.mysubscribe) ?
      'select count(*) as lastEnd from userRelation left join user on userRelation.publishUserId=user.id where userRelation.subscribeUserId=? and user.name like ?' :
      'select count(*) as lastEnd from user where user.name like ?';
    const fetchUser = (this.mysubscribe) ?
      'select distinct user.id, user.email, user.name from userRelation left join user on userRelation.publishUserId=user.id where userRelation.subscribeUserId=? and user.name like ? limit ?,?' :
      'select distinct user.id, user.email, user.name from user where user.name like ? limit ?,?';
    const user = await this.dao.serialize(async db => {
      if(this.mysubscribe) {
        await this.checkAuthorized(db);
      }
      const metadata = await db.get(fetchMetadata, fetchOptions);
      const lastEnd = metadata[0].lastEnd;
      const users = await db.get(fetchUser, fetchOptions);
      res.json({
        users,
        requestEnd: this.end,
        lastEnd: metadata[0].lastEnd
      });
    });
  }
}
module.exports = UserModel;
