export function parseJsonArrayFromText(text: string) {
  let jsonData = null;

  const jsonBlockPattern = /```json\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockPattern);

  if (jsonBlockMatch) {
    try {
      jsonData = JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      return null;
    }
  } else {
    const arrayPattern = /\[\s*{[\s\S]*?}\s*\]/;
    const arrayMatch = text.match(arrayPattern);

    if (arrayMatch) {
      try {
        jsonData = JSON.parse(arrayMatch[0]);
      } catch (e) {
        return null;
      }
    }
  }

  console.log("jsonData", jsonData);

  if (Array.isArray(jsonData)) {
    return jsonData;
  } else {
    return null;
  }
}

export function parseJSONObjectFromText(text: string) {
  let jsonData = null;

  const jsonBlockPattern = /```json\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockPattern);

  if (jsonBlockMatch) {
    try {
      jsonData = JSON.parse(jsonBlockMatch[1]);
    } catch (e) {
      return null;
    }
  } else {
    const objectPattern = /{[\s\S]*?}/;
    const objectMatch = text.match(objectPattern);

    if (objectMatch) {
      try {
        jsonData = JSON.parse(objectMatch[0]);
      } catch (e) {
        return null;
      }
    }
  }

  if (
    typeof jsonData === "object" &&
    jsonData !== null &&
    !Array.isArray(jsonData)
  ) {
    return jsonData;
  } else if (typeof jsonData === "object" && Array.isArray(jsonData)) {
    return parseJsonArrayFromText(text);
  } else {
    return null;
  }
}
