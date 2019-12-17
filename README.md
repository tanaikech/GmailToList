# GmailToList

<a name="top"></a>
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="overview"></a>

# Overview

**This is a library for exporting all messages of Gmail as a list using Google Apps Script (GAS).**

<a name="description"></a>

# Description

Recently, I have had a situation it had been required to backup all messages in own Gmail. In order to achieve this, I created a simple script. After I created it, I thought that when such situation might occur for other users and the script is published as a library, they might be useful. So I created this library. But I created this for my situation. So if this cannot be used for your environment and an error occurs, I apologize.

When this library is used, all messages of own Gmail can be exported as a list. This library can export a list as an object and an array. The array can be directly used for putting it to Google Spreadsheet.

# Library's project key

```
1ZZfjzKy37lzld3fIB9N3EQ3I1A6Mixz2MWqpu5f3YoiHUMAdCX0lEMYh
```

# Methods

| Methods                                           | Description                                     |
| :------------------------------------------------ | :---------------------------------------------- |
| [Do(object)](#do)                                 | Retrieve all messages from own Gmail as a list. |
| [getAttachmentFiles(object)](#getattachmentfiles) | Retrieve attachment files as blob.              |

<a name="usage"></a>

# Usage:

## 1. Install library

In order to use this library, please install this library, enable Gmail API at Advanced Google services. You can see the flow of them as follows.

1. Create a GAS project.

   - You can use this library for the GAS project of both the standalone type and the container-bound script type.

1. [Install GmailToList library](https://developers.google.com/apps-script/guides/libraries).

   - Library's project key is **`1ZZfjzKy37lzld3fIB9N3EQ3I1A6Mixz2MWqpu5f3YoiHUMAdCX0lEMYh`**.

1. [Enable Gmail API at Advanced Google services](https://developers.google.com/apps-script/guides/services/advanced#enabling_advanced_services).

### About scopes

About the install of scopes used at this library, users are not required to install scopes. Because this library can automatically install the required scopes to the project which installed this library. The detail information about this can be seen at [here](https://gist.github.com/tanaikech/23ddf599a4155b66f1029978bba8153b).

The following scopes are automatically set when you install this library. When you run the script for the 1st time, please authorize them.

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/script.external_request`

### External library

This library uses an external GAS library. It's [BatchRequest](https://github.com/tanaikech/BatchRequest). All messages of Gmail are retrieved by the batch request. In this case, the number of API call can be reduced. But the current quota of "Email read/write (excluding send)" is 20,000 / day. [Ref](https://developers.google.com/apps-script/guides/services/quotas) Please be careful this.

<a name="do"></a>

## 2. Method: `Do`

### Sample 1

A sample script is as follows.

```javascript
var res = GmailToList.Do();

Logger.log(res);
// Logger.log(res.array);

//  SpreadsheetApp.getActiveSheet().getRange(1, 1, res.array.length, res.array[0].length).setValues(res.array);
```

- In this sample script, the object like `res = {array: [], statistics: {}}` is returned. `res.array` and `res.statistics` are the 2 dimensional array for putting to Google Spreadsheet and the statistics of Gmail, respectively.
  - The statistics are the total threads, total messages, total message size, total attachment files and total attachment file size.
- In this script, when `SpreadsheetApp.getActiveSheet().getRange(1, 1, res.array.length, res.array[0].length).setValues(res.array);` is used, the result value can be put to the active sheet.

### Sample 2

```javascript
var object = {
  userId: "me",
  labelNames: ["sample1", "sample2"],
  exportAsObject: true
  //   headers: false
};
var res = GmailToList.Do(object);

Logger.log(res);
// Logger.log(res.object);
```

- `userId`: Default value is `me`.
- `labelNames`: Default value is `null`. If you want to retrieve the messages with the label names, please set this. At above sample script, the messages with the label names of `sample1 AND sample2` are retrieved.
- `exportAsObject`: Default is `false`. When you use this as `true`, the result is returned as an object. In this case, you can see it at `res.object`.
  - When you use this as `false`, the result is returned as an array. In this case, you can see it at `res.array`. And this can be directly used for putting the Google Spreadsheet. So the values for each cell are rounded for 50,000 bytes which is the maximum length of one cell.
- `headers`: Default is `true`. This is used for `exportAsObject: false`. When this is used as `false`, the headers for the returned array are not included.

### Sample result

The value of `res.statistics` is as follows.

```json
{
  "totalThreads": #,
  "totalMessages": #,
  "totalMessageSize": #,
  "totalAttachmentFiles": #,
  "totalAttachmentFileSize": #
}
```

The value of `res.array` is as follows.

```
[
  ["threadId","date","messageId","from","to","subject","body including in formation of attachment files","","","","","","","","","","","","","","","","","",],
  ["###threadId###","2000-01-01T00:00:00.000Z","###messageId###","###from###","###to###","###subject###","text/plain","###size###","###textbody###","text/html","###size###","###HTMLbody###","###mimeTypeofattachmentfile###","###size###","###filename###","###attachmentId###","###mimeTypeofattachmentfile###","###size###","###filename###","###attachmentId###","###mimeTypeofattachmentfile###","###size###","###filename###","###attachmentId###"]
]
```

- `attachmentId`: When present, contains the ID of an external attachment that can be retrieved in a separate messages.attachments.get request. When not present, the entire content of the message part body is contained in the data field. [Ref](https://developers.google.com/gmail/api/v1/reference/users/messages/attachments)i/v1/reference/users/messages/attachments/get

<a name="getattachmentfiles"></a>

## 3. Method: `getAttachmentFiles`

### Sample script

```javascript
var object = {
  userId: "me",
  attachments: [
    {
      messageId: "###",
      attachmentId: "###",
      filename: "###",
      mimeType: "###"
    },
    ,
    ,
  ]
};
var res = GmailToList.getAttachmentFiles(object);
```

### Sample result

```json
[
  {
    "size": ##,
    "data": Blob,
    "filename": "###",
    "mimeType": "###"
  },
  ,
  ,
]
```

You can create files using the blob.

---

<a name="licence"></a>

# Licence

[MIT](LICENCE)

<a name="author"></a>

# Author

[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to tell me.

<a name="updatehistory"></a>

# Update History

- v1.0.0 (December 16, 2019)

  1. Initial release.

- v1.0.1 (December 17, 2019)

  1. [New method of `getAttachmentFiles()`](#getattachmentfiles) was added. The attachment files can be retrieved as blob using this method.

[TOP](#top)
