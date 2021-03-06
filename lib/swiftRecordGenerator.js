String.prototype.splitInLines = function(newline) {
    const rawLines = this.split(newline);
    const lines = [];

    rawLines.forEach((line) => {
        if (line.trim().length > 0)
            lines.push(line);
    });

    return lines;
};

const fieldTypes = {
    text: "String",
    integer: "Int64",
    real: "Float",
    blob: "Data"
};

function getFieldType(column) {
    return fieldTypes[column.type] || "String";
}

function getIndentation(spaces) {
    var out = "";

    for (var i = 0; i < spaces; i++) {
        out += " ";
    }

    return out;
}

function getStaticColumnNames(columns, indentation, newline) {
    var out = "";
    var count = 0;

    columns.forEach((column) => {
        count++;
        out += `${indentation}static let ${column.name} = Column("${column.name}")`;

        if (count < columns.length) {
            out += newline;
        }
    });

    return out;
}

function getRowInitValues(columns, indentation, newline) {
    var out = "";
    var count = 0;

    columns.forEach((column) => {
        count++;
        out += `${indentation}${column.name} = row[Columns.${column.name}]`;

        if (count < columns.length) {
            out += newline;
        }
    });

    return out;
}

function getEncodeContainerFields(columns, indentation, newline) {
    var out = "";
    var count = 0;

    columns.forEach((column) => {
        count++;
        out += `${indentation}container[Columns.${column.name}] = ${column.name}`

        if (count < columns.length) {
            out += newline;
        }
    });

    return out;
}

function getColumnsToInit(columns) {
    var out = [];

    columns.forEach((column) => {
        if (!column.isNull && column.defaultValue == null && !column.isPrimaryKey) {
            out.push(column);
        }
    });

    return out;
}

function getInitArguments(columns) {
    var out = "";

    columns.forEach((column) => {
        out += `${column.name}: ${getFieldType(column)}, `;
    });

    if (out.endsWith(", ")) {
        out = out.substr(0, out.length - 2);
    }

    return out;
}

function getInitAssignments(columns, indentation, newline) {
    var out = "";

    columns.forEach((column) => {
        out += `${indentation}self.${column.name} = ${column.name}${newline}`;
    });

    return out;
}

function getFields(columns, fieldsIndentation, newline) {
    var out = "";
    var count = 0;

    columns.forEach((column) => {
        count++;
        var fieldType = getFieldType(column);

        out += `${fieldsIndentation}var ${column.name}: ${fieldType}`;

        if (column.isNull || column.isPrimaryKey) {
            out += "?";
        }

        if (column.defaultValue !== null) {
            if (fieldType === "String") {
                out += ` = "${column.defaultValue}"`;
            } else {
                out += ` = ${column.defaultValue}`;
            }
        }

        if (count <= (columns.length - 1)) {
            out += newline;
        }
    });

    return out;
}

function getCreateTableSql(addStatement, sql, fieldsIndentation, indentation, newline) {
    if (!addStatement)
        return "";

    var create = `${newline}${fieldsIndentation}static let createTable = "CREATE TABLE \\(databaseTableName) (" +${newline}`;

    var lines = sql.splitInLines(newline);

    for (var i = 1; i < lines.length; i++) {
        create += `${indentation}${fieldsIndentation}"${lines[i].trim()} "`;

        if (i < (lines.length - 1)) {
            create += ` +${newline}`;
        } else {
            create += `${newline}`;
        }
    }

    return create;
}

function getInit(columns, fieldsIndentation, indentation, newline) {
    var columnsToInit = getColumnsToInit(columns);

    if (columnsToInit.length == 0) {
        return `${fieldsIndentation}override init() {
        super.init()
    }`;
    }

    var swiftInit = `${fieldsIndentation}init(${getInitArguments(columnsToInit)}) {${newline}`;
    swiftInit += getInitAssignments(columnsToInit, indentation, newline);
    swiftInit += `${indentation}super.init()${newline}`;
    swiftInit += `${fieldsIndentation}}`;

    return swiftInit;
}

function generateRecordClass(sql, createTable, config) {
    const newline = config.new_line_character;
    const fieldsIndentation = getIndentation(config.indentation);
    const indentation = `${fieldsIndentation}${fieldsIndentation}`;

    const fields = getFields(createTable.columns, fieldsIndentation, newline);
    const staticCreateTable = getCreateTableSql(config.add_create_table, sql, fieldsIndentation, indentation, newline);
    const columnNames = getStaticColumnNames(createTable.columns, indentation, newline);
    const initializer = getInit(createTable.columns, fieldsIndentation, indentation, newline);
    const rowInitializer = getRowInitValues(createTable.columns, indentation, newline);
    const encodeFields = getEncodeContainerFields(createTable.columns, indentation, newline);

    return `// Generated by https://github.com/gotev/GRDB-Record-Generator
import Foundation
import GRDB

class ${createTable.swiftClassName}: Record {

${fields}
${staticCreateTable}

    override class var databaseTableName: String {
        return "${createTable.tableName}"
    }

    enum Columns {
${columnNames}
    }

${initializer}

    required init(row: Row) {
${rowInitializer}
        super.init(row: row)
    }

    override func encode(to container: inout PersistenceContainer) {
${encodeFields}
    }

}
`;
}

module.exports = generateRecordClass;
