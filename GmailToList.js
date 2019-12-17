/**
 * GitHub  https://github.com/tanaikech/GmailToList<br>
 * Get all messages from Gmail as a list.<br>
 * @param {Object} Object Object
 * @return {Object} Return Object
 */
function Do(object) {
    return new GmailToList(object).Do();
}

/**
 * Get attachment files from Gmail.<br>
 * @param {Object} Object Object
 * @return {Object} Return Object
 */
function getAttachmentFiles(object) {
    return new GmailToList().getAttachmentFiles(object);
}
;
(function(r) {
  var GmailToList;
  GmailToList = (function() {
    var convertObjectToArray, getAllMessagesAsObject, getAllMessagesByGmailAPI, getAttachmentFilesAsBlob, getData, getMessages;

    GmailToList.name = "GmailToList";

    function GmailToList(obj_) {
      this.cellLmit = 50000;
      this.url = "https://www.googleapis.com/gmail/v1/users/";
      if (!obj_) {
        obj_ = {};
      }
      if (!("userId" in obj_)) {
        obj_.userId = "me";
      }
      if (!("exportAsObject" in obj_)) {
        obj_.exportAsObject = false;
      }
      if (!("headers" in obj_)) {
        obj_.headers = true;
      }
      this.obj = obj_;
      this.obj.statistics = {
        totalThreads: 0,
        totalMessages: 0,
        totalMessageSize: 0,
        totalAttachmentFiles: 0,
        totalAttachmentFileSize: 0
      };
    }

    GmailToList.prototype.Do = function() {
      var array, err, obj, resObj;
      try {
        obj = getAllMessagesAsObject.call(this);
        array = convertObjectToArray.call(this, obj);
        resObj = {
          statistics: this.obj.statistics
        };
        if (this.obj.exportAsObject) {
          resObj.object = obj;
          return resObj;
        }
        resObj.array = array;
        return resObj;
      } catch (error) {
        err = error;
        return {
          error: err
        };
      }
    };

    GmailToList.prototype.getAttachmentFiles = function(obj_) {
      var err;
      try {
        if (!("attachments" in obj_) || !Array.isArray(obj_.attachments)) {
          return {
            error: "No attachments."
          };
        }
        if (!("userId" in obj_) || obj_.userId === "") {
          obj_.userId = "me";
        }
        return getAttachmentFilesAsBlob.call(this, obj_);
      } catch (error) {
        err = error;
        return {
          error: err
        };
      }
    };

    getAllMessagesAsObject = function() {
      var obj, threads;
      threads = getAllMessagesByGmailAPI.call(this);
      obj = threads.map((function(_this) {
        return function(t) {
          var messages;
          messages = t.messages.map(function(e) {
            var bodyObj, o, payload;
            o = {};
            o.id = e.id;
            payload = e.payload;
            payload.headers.forEach(function(h) {
              switch (h.name.toUpperCase()) {
                case "DATE":
                  o.date = new Date(h.value);
                  break;
                case "FROM":
                  o.from = h.value;
                  break;
                case "TO":
                  o.to = h.value;
                  break;
                case "SUBJECT":
                  o.subject = h.value;
              }
              if (!o.date && "internalDate" in e) {
                return o.date = new Date(Number(e.internalDate));
              }
            });
            bodyObj = getData.call(_this, payload, _this.obj.exportAsObject, _this.cellLmit);
            _this.obj.statistics.totalMessageSize += bodyObj.totalMessageSize;
            _this.obj.statistics.totalAttachmentFiles += bodyObj.totalAttachmentFiles;
            _this.obj.statistics.totalAttachmentFileSize += bodyObj.totalAttachmentFileSize;
            o.body = bodyObj.bodies;
            return o;
          });
          return {
            threadId: t.id,
            messages: messages
          };
        };
      })(this));
      obj.reverse();
      this.obj.statistics.totalThreads = threads.length;
      return obj;
    };

    getAllMessagesByGmailAPI = function() {
      var ids, lo, pageToken, res, resource, threadIds, threads, userId;
      userId = this.obj.userId;
      if ("labelNames" in this.obj && Array.isArray(this.obj.labelNames)) {
        lo = Gmail.Users.Labels.list(userId).labels.reduce(function(o, e) {
          o[e.name] = e.id;
          return o;
        }, {});
        this.obj.labelIds = this.obj.labelNames.map(function(e) {
          return lo[e];
        });
      }
      threadIds = [];
      pageToken = "";
      resource = {
        maxResults: 1000
      };
      if ("labelIds" in this.obj && this.obj.labelIds.length > 0) {
        resource.labelIds = this.obj.labelIds;
      }
      while (true) {
        resource.pageToken = pageToken;
        res = Gmail.Users.Threads.list(userId, resource);
        ids = res.threads.map(function(e) {
          return e.id;
        });
        Array.prototype.push.apply(threadIds, ids);
        pageToken = res.nextPageToken;
        if (!pageToken) {
          break;
        }
      }
      threads = getMessages.call(this, userId, threadIds);
      return threads;
    };

    getMessages = function(userId, threadIds) {
      var batchReqs, i, j, limit, ref, requests, response, split, temp, threads, threadsFromBatch, url;
      limit = 100;
      split = Math.ceil(threadIds.length / limit);
      threads = [];
      url = this.url;
      for (i = j = 0, ref = split; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        batchReqs = threadIds.splice(0, limit).map(function(id) {
          return {
            method: "GET",
            endpoint: url + userId + "/threads/" + id + "?fields=*"
          };
        });
        requests = {
          batchPath: "/gmail/v1/users/",
          requests: batchReqs
        };
        response = BatchRequest.Do(requests).getContentText();
        temp = response.split("--batch");
        threadsFromBatch = temp.slice(1, temp.length - 1).map(function(e) {
          return JSON.parse(e.match(/{[\S\s]+}/g)[0]);
        });
        Array.prototype.push.apply(threads, threadsFromBatch);
      }
      return threads;
    };

    getData = function(ar, exportAsObject, cellLmit) {
      return (function() {
        var c;
        return (c = function(ar, res) {
          var body, bodySize, fileSize;
          if ("parts" in ar && Array.isArray(ar.parts)) {
            ar.parts.forEach(function(e) {
              c(e, res);
            });
          }
          if ("data" in ar.body) {
            body = Utilities.newBlob(Utilities.base64DecodeWebSafe(ar.body.data)).getDataAsString();
            if (!exportAsObject && body.length > cellLmit) {
              body = body.slice(0, cellLmit);
            }
            bodySize = ar.body.size;
            res.totalMessageSize += bodySize;
            res.bodies.push({
              mimeType: ar.mimeType,
              size: bodySize,
              body: body
            });
          } else if ("attachmentId" in ar.body) {
            fileSize = ar.body.size;
            res.totalAttachmentFileSize += fileSize;
            res.totalAttachmentFiles += 1;
            res.bodies.push({
              mimeType: ar.mimeType,
              size: fileSize,
              filename: ar.filename,
              attachmentId: ar.body.attachmentId
            });
          }
          return res;
        })(ar, {
          bodies: [],
          totalMessageSize: 0,
          totalAttachmentFiles: 0,
          totalAttachmentFileSize: 0
        });
      })();
    };

    convertObjectToArray = function(obj) {
      var maxLen, values;
      values = obj.reduce(function(oa, e) {
        var temp;
        temp = e.messages.map(function(m) {
          var ar, body;
          ar = [e.threadId, m.date, m.id, m.from, m.to, m.subject];
          body = m.body.reduce(function(ma, b) {
            t;
            var t;
            if (Array.isArray(b)) {
              t = b.reduce(function(ba, bb) {
                Array.prototype.push.apply(ba, [bb.mimeType, bb.size, bb.body]);
                return ba;
              }, []);
            } else {
              t = [b.mimeType, b.size];
              if ("filename" in b) {
                t.push(b.filename);
              }
              if ("attachmentId" in b) {
                t.push(b.attachmentId);
              }
              if ("body" in b) {
                t.push(b.body);
              }
            }
            Array.prototype.push.apply(ma, t);
            return ma;
          }, []);
          Array.prototype.push.apply(ar, body);
          return ar;
        });
        Array.prototype.push.apply(oa, temp);
        return oa;
      }, []);
      if (this.obj.headers) {
        values.unshift(["threadId", "date", "messageId", "from", "to", "subject", "body including information of attachment files"]);
      }
      maxLen = Math.max.apply(null, values.map(function(e) {
        return e.length;
      }));
      values = values.map(function(e) {
        Array.prototype.push.apply(e, Array.apply(null, new Array(maxLen - e.length)).map(function(_, i) {
          return "";
        }));
        return e;
      });
      this.obj.statistics.totalMessages = values.length;
      return values;
    };

    getAttachmentFilesAsBlob = function(obj_) {
      var attachmentIds, attachments, attachmentsFromBatch, batchReqs, i, j, limit, ref, reqs, requests, response, split, temp, userId;
      userId = obj_.userId;
      attachmentIds = obj_.attachments;
      limit = 100;
      split = Math.ceil(attachmentIds.length / limit);
      attachments = [];
      for (i = j = 0, ref = split; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        reqs = attachmentIds.splice(0, limit);
        batchReqs = reqs.map(function(e) {
          return {
            method: "GET",
            endpoint: "https://www.googleapis.com/gmail/v1/users/" + userId + "/messages/" + e.messageId + "/attachments/" + e.attachmentId
          };
        });
        requests = {
          batchPath: "/gmail/v1/users/",
          requests: batchReqs
        };
        response = BatchRequest.Do(requests).getContentText();
        temp = response.split("--batch");
        attachmentsFromBatch = temp.slice(1, temp.length - 1).map(function(e) {
          return JSON.parse(e.match(/{[\S\s]+}/g)[0]);
        });
        attachmentsFromBatch.forEach(function(e, i) {
          attachmentsFromBatch[i].filename = reqs[i].filename;
          attachmentsFromBatch[i].mimeType = reqs[i].mimeType;
          attachmentsFromBatch[i].data = Utilities.newBlob(Utilities.base64DecodeWebSafe(attachmentsFromBatch[i].data), reqs[i].mimeType, reqs[i].filename);
        });
        Array.prototype.push.apply(attachments, attachmentsFromBatch);
      }
      return attachments;
    };

    return GmailToList;

  })();
  return r.GmailToList = GmailToList;
})(this);
