// Generated by https://github.com/gotev/GRDB-Record-Generator
import Foundation
import GRDB

class UserCarModel: Record {

    var _id: Int64?
    var user_id: Int64
    var car_id: Int64


    override class var databaseTableName: String {
        return "user_car"
    }

    enum Columns {
        static let _id = Column("_id")
        static let user_id = Column("user_id")
        static let car_id = Column("car_id")
    }

    init(user_id: Int64, car_id: Int64) {
        self.user_id = user_id
        self.car_id = car_id
        super.init()
    }

    required init(row: Row) {
        _id = row.value(Columns._id)
        user_id = row.value(Columns.user_id)
        car_id = row.value(Columns.car_id)
        super.init(row: row)
    }

    override func encode(to container: inout PersistenceContainer) {
        container[Columns._id] = _id
        container[Columns.user_id] = user_id
        container[Columns.car_id] = car_id
    }

}
