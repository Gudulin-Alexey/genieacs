/**
 * Copyright 2013-2018  Zaid Abdulla
 *
 * This file is part of GenieACS.
 *
 * GenieACS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * GenieACS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with GenieACS.  If not, see <http://www.gnu.org/licenses/>.
 */
"use strict";

const config = require("./config");
const common = require("./common");
const device = require("./device");
const scheduling = require("./scheduling");

const MAX_DEPTH = config.get("MAX_DEPTH");

function refresh(sessionContext, provision, declarations) {
  const path = common.parsePath(provision[1]).slice();
  const l = path.length;
  path.length = MAX_DEPTH;
  path.fill("*", l);
  const every = 1000 * (provision[2] || 1);
  const offset = scheduling.variance(sessionContext.deviceId, every);
  const t = scheduling.interval(sessionContext.timestamp, every, offset);

  for (let i = l; i < path.length; ++i) {
    declarations.push([
      path.slice(0, i),
      t,
      { object: 1, writable: 1, value: t }
    ]);
  }

  return true;
}

function value(sessionContext, provision, declarations) {
  const path = common.parsePath(provision[1]);
  declarations.push([path, 1, { value: 1 }, null, { value: [provision[2]] }]);

  return true;
}

function tag(sessionContext, provision, declarations) {
  const path = ["Tags", provision[1]];
  declarations.push([path, 1, { value: 1 }, null, { value: [provision[2]] }]);

  return true;
}

function reboot(sessionContext, provision, declarations) {
  declarations.push([
    ["Reboot"],
    1,
    { value: 1 },
    null,
    { value: [sessionContext.timestamp] }
  ]);

  return true;
}

function reset(sessionContext, provision, declarations) {
  declarations.push([
    ["FactoryReset"],
    1,
    { value: 1 },
    null,
    { value: [sessionContext.timestamp] }
  ]);

  return true;
}

function download(sessionContext, provision, declarations) {
  const alias = [
    ["FileType"],
    provision[1] || "",
    ["FileName"],
    provision[2] || "",
    ["TargetFileName"],
    provision[3] || ""
  ];

  declarations.push([["Downloads", alias], 1, {}, 1]);
  declarations.push([
    ["Downloads", alias, "Download"],
    1,
    { value: 1 },
    null,
    { value: [sessionContext.timestamp] }
  ]);

  return true;
}

function instances(
  sessionContext,
  provision,
  declarations,
  startRevision,
  endRevision
) {
  let count = Number(provision[2]);

  if (Number.isNaN(count)) return true;

  const path = common.parsePath(provision[1]);

  if (provision[2][0] === "+" || provision[2][0] === "-") {
    declarations.push([path, 1]);

    if (endRevision === startRevision) return false;

    const unpacked = device.unpack(
      sessionContext.deviceData,
      path,
      startRevision + 1
    );
    count = Math.max(0, unpacked.length + count);
  }

  declarations.push([path, 1, null, count]);

  return true;
}

exports.refresh = refresh;
exports.value = value;
exports.tag = tag;
exports.reboot = reboot;
exports.reset = reset;
exports.download = download;
exports.instances = instances;
