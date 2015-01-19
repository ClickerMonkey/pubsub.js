
/**
 *
 * @param number capacity
 */
function CircularArray(capacity)
{
  this.capacity = capacity;
}

/**
 *
 */
CircularArray.prototype = new Array();

/**
 *
 * @param any item
 */
CircularArray.prototype.add = function(item)
{
  if (this.capacity > 0)
  {
    while (this.length >= this.capacity)
    {
      this.shift();
    }
    
    this.push(item);
  }
};

module.exports = CircularArray;